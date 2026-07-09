import re
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.routes.contributions import owned_contribution
from app.core.config import settings
from app.core.database import get_db
from app.models.contribution import ContributionAsset
from app.models.user import User
from app.schemas.upload import (
    AssetRead,
    ConfirmUploadRequest,
    SignedUploadRequest,
    SignedUploadResponse,
)
from app.services.storage import LocalObjectStorage, ObjectStorage, get_storage

router = APIRouter(prefix="/uploads")
UPLOAD_TOKEN_ALGORITHM = "HS256"
UPLOAD_EXPIRES_SECONDS = 900

ALLOWED_CONTENT_TYPES = {
    "audio/wav": ("audio", "wav"),
    "audio/mpeg": ("audio", "mp3"),
    "audio/flac": ("audio", "flac"),
    "audio/aac": ("audio", "aac"),
    "audio/mp4": ("audio", "m4a"),
    "audio/x-m4a": ("audio", "m4a"),
    "audio/ogg": ("audio", "ogg"),
    "audio/webm": ("audio", "webm"),
    "image/jpeg": ("image", "jpg"),
    "image/png": ("image", "png"),
    "image/webp": ("image", "webp"),
    "image/gif": ("image", "gif"),
    "image/avif": ("image", "avif"),
    "image/bmp": ("image", "bmp"),
    "image/heic": ("image", "heic"),
    "image/heif": ("image", "heif"),
    "image/tiff": ("image", "tiff"),
    "video/mp4": ("video", "mp4"),
    "video/quicktime": ("video", "mov"),
    "video/webm": ("video", "webm"),
    "video/x-matroska": ("video", "mkv"),
    "application/pdf": ("document", "pdf"),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
        "document",
        "docx",
    ),
    "text/plain": ("document", "txt"),
    "text/csv": ("document", "csv"),
    "application/json": ("document", "json"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (
        "document",
        "xlsx",
    ),
}


def storage_or_503() -> ObjectStorage:
    try:
        return get_storage()
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc))


def safe_filename(filename: str) -> str:
    name = Path(filename).name
    return re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip(".-") or "upload"


@router.put("/local/{upload_token}", include_in_schema=False)
async def local_upload(
    upload_token: str,
    request: Request,
    storage: ObjectStorage = Depends(storage_or_503),
) -> Response:
    if not isinstance(storage, LocalObjectStorage):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    try:
        claims = jwt.decode(
            upload_token,
            settings.jwt_secret,
            algorithms=[UPLOAD_TOKEN_ALGORITHM],
        )
        if claims.get("purpose") != "local_object_upload":
            raise ValueError("wrong token purpose")
        storage_key = claims["storage_key"]
        content_type = claims["content_type"]
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired upload URL")
    if request.headers.get("content-type", "").lower() != content_type:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Content-Type mismatch")
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_upload_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    content = await request.body()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    storage.put_object(storage_key, content_type, content)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/signed-url", response_model=SignedUploadResponse)
def signed_url(
    payload: SignedUploadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    storage: ObjectStorage = Depends(storage_or_503),
) -> SignedUploadResponse:
    contribution = owned_contribution(db, payload.contribution_id, user)
    if contribution.author_id != user.id or contribution.status != "draft":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Assets can only be added by the author while the contribution is a draft",
        )
    media = ALLOWED_CONTENT_TYPES.get(payload.content_type.lower())
    if media is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "File type not allowed")
    if payload.file_size > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds the {settings.max_upload_bytes}-byte limit",
        )

    media_type, file_format = media
    filename = safe_filename(payload.filename)
    storage_key = (
        f"contributions/{contribution.id}/{media_type}/{uuid.uuid4()}-{filename}"
    )
    now = datetime.now(UTC)
    token_payload = {
        "sub": str(user.id),
        "contribution_id": str(contribution.id),
        "storage_key": storage_key,
        "filename": filename,
        "content_type": payload.content_type.lower(),
        "file_size": payload.file_size,
        "media_type": media_type,
        "file_format": file_format,
        "iat": now,
        "exp": now + timedelta(seconds=UPLOAD_EXPIRES_SECONDS),
        "purpose": "upload_confirmation",
    }
    upload_token = jwt.encode(
        token_payload,
        settings.jwt_secret,
        algorithm=UPLOAD_TOKEN_ALGORITHM,
    )
    return SignedUploadResponse(
        upload_url=storage.create_upload_url(
            storage_key,
            payload.content_type.lower(),
            UPLOAD_EXPIRES_SECONDS,
        ),
        upload_token=upload_token,
        storage_key=storage_key,
        expires_in=UPLOAD_EXPIRES_SECONDS,
        required_headers={"Content-Type": payload.content_type.lower()},
    )


@router.post("/confirm", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def confirm_upload(
    payload: ConfirmUploadRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    storage: ObjectStorage = Depends(storage_or_503),
) -> ContributionAsset:
    try:
        claims = jwt.decode(
            payload.upload_token,
            settings.jwt_secret,
            algorithms=[UPLOAD_TOKEN_ALGORITHM],
        )
        if claims.get("purpose") != "upload_confirmation":
            raise ValueError("wrong token purpose")
        if claims["sub"] != str(user.id):
            raise ValueError("wrong uploader")
        contribution_id = uuid.UUID(claims["contribution_id"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired upload token")

    contribution = owned_contribution(db, contribution_id, user)
    if contribution.author_id != user.id or contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Contribution is no longer editable")
    existing = db.scalar(
        select(ContributionAsset).where(
            ContributionAsset.storage_key == claims["storage_key"]
        )
    )
    if existing:
        return existing

    try:
        metadata = storage.object_metadata(claims["storage_key"])
    except Exception:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Uploaded object could not be verified",
        )
    actual_size = int(metadata.get("ContentLength", -1))
    actual_type = str(metadata.get("ContentType", "")).lower()
    if actual_size != claims["file_size"] or actual_type != claims["content_type"]:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Uploaded object metadata does not match the signed request",
        )

    asset = ContributionAsset(
        contribution_id=contribution.id,
        uploaded_by=user.id,
        storage_key=claims["storage_key"],
        original_filename=claims["filename"],
        media_type=claims["media_type"],
        content_type=claims["content_type"],
        file_size=actual_size,
        checksum=payload.checksum,
        duration=payload.duration,
        file_format=claims["file_format"],
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
