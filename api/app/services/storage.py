from functools import lru_cache
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Protocol

import boto3
import jwt
from botocore.config import Config

from app.core.config import settings


class ObjectStorage(Protocol):
    def create_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int,
    ) -> str: ...

    def object_metadata(self, storage_key: str) -> dict[str, object]: ...

    def create_download_url(self, storage_key: str, expires_in: int) -> str: ...


class LocalObjectStorage:
    """Disk-backed object storage for local development only."""

    def __init__(self) -> None:
        self.root = Path(settings.local_storage_path).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, storage_key: str) -> Path:
        path = (self.root / storage_key).resolve()
        if self.root not in path.parents:
            raise ValueError("Invalid storage key")
        return path

    def create_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int,
    ) -> str:
        token = jwt.encode(
            {
                "storage_key": storage_key,
                "content_type": content_type,
                "purpose": "local_object_upload",
                "exp": datetime.now(UTC) + timedelta(seconds=expires_in),
            },
            settings.jwt_secret,
            algorithm="HS256",
        )
        return f"{settings.local_storage_base_url.rstrip('/')}/api/v1/uploads/local/{token}"

    def put_object(self, storage_key: str, content_type: str, content: bytes) -> None:
        path = self._path(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        path.with_suffix(path.suffix + ".metadata.json").write_text(
            json.dumps(
                {
                    "ContentLength": len(content),
                    "ContentType": content_type,
                }
            ),
            encoding="utf-8",
        )

    def object_metadata(self, storage_key: str) -> dict[str, object]:
        path = self._path(storage_key)
        metadata_path = path.with_suffix(path.suffix + ".metadata.json")
        if not path.is_file() or not metadata_path.is_file():
            raise FileNotFoundError(storage_key)
        return json.loads(metadata_path.read_text(encoding="utf-8"))

    def create_download_url(self, storage_key: str, expires_in: int) -> str:
        token = jwt.encode(
            {
                "storage_key": storage_key,
                "purpose": "local_object_download",
                "exp": datetime.now(UTC) + timedelta(seconds=expires_in),
            },
            settings.jwt_secret,
            algorithm="HS256",
        )
        return f"{settings.local_storage_base_url.rstrip('/')}/api/v1/uploads/local-download/{token}"

    def read_object(self, storage_key: str) -> tuple[bytes, str]:
        path = self._path(storage_key)
        metadata = self.object_metadata(storage_key)
        return path.read_bytes(), str(metadata["ContentType"])


class R2Storage:
    def __init__(self) -> None:
        missing = [
            name
            for name, value in {
                "R2_ENDPOINT_URL": settings.r2_endpoint_url,
                "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
                "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
                "R2_BUCKET_NAME": settings.r2_bucket_name,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"Object storage is not configured: {', '.join(missing)}")
        self.bucket = settings.r2_bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

    def create_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int,
    ) -> str:
        return self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.bucket,
                "Key": storage_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    def object_metadata(self, storage_key: str) -> dict[str, object]:
        return self.client.head_object(Bucket=self.bucket, Key=storage_key)

    def create_download_url(self, storage_key: str, expires_in: int) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=expires_in,
        )


@lru_cache
def get_storage() -> ObjectStorage:
    if settings.storage_backend == "local":
        if settings.environment != "development":
            raise RuntimeError("Local object storage is restricted to development")
        return LocalObjectStorage()
    if settings.storage_backend != "r2":
        raise RuntimeError(f"Unknown storage backend: {settings.storage_backend}")
    return R2Storage()
