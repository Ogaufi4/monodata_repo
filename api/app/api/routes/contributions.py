import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.models.contribution import Category, Consent, Contribution, TranslationPair
from app.models.language import Dialect, Language, SpeechCommunity
from app.models.intelligence import ImageAnnotation
from app.models.user import User
from app.schemas.contribution import (
    CategoryCreate,
    CategoryRead,
    ConsentCreate,
    ConsentRead,
    ContributionCreate,
    ContributionRead,
    TranslationCreate,
    TranslationRead,
)
from app.schemas.upload import AssetRead

router = APIRouter()
admin = require_roles("admin", "super_admin")


def owned_contribution(db: Session, contribution_id: uuid.UUID, user: User) -> Contribution:
    contribution = db.get(Contribution, contribution_id)
    if contribution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contribution not found")
    roles = {role.name for role in user.roles}
    if contribution.author_id != user.id and not roles.intersection(
        {"reviewer", "admin", "super_admin"}
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Contribution access denied")
    return contribution


def validate_taxonomy(db: Session, payload: ContributionCreate) -> None:
    if db.get(Language, payload.language_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown language_id")
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown category_id")
    if payload.target_language_id and db.get(Language, payload.target_language_id) is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown target_language_id"
        )
    for dialect_id, language_id, field in (
        (payload.dialect_id, payload.language_id, "dialect_id"),
        (
            payload.target_dialect_id,
            payload.target_language_id,
            "target_dialect_id",
        ),
    ):
        if dialect_id:
            dialect = db.get(Dialect, dialect_id)
            if dialect is None or dialect.language_id != language_id:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    f"{field} does not belong to its selected language",
                )
    if payload.speech_community_id and db.get(
        SpeechCommunity, payload.speech_community_id
    ) is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown speech_community_id"
        )


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(
        db.scalars(
            select(Category).where(Category.is_active.is_(True)).order_by(Category.name)
        )
    )


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Category already exists")
    db.refresh(category)
    return category


@router.get("/contributions", response_model=list[ContributionRead])
def list_contributions(
    contribution_status: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Contribution]:
    query = (
        select(Contribution)
        .where(Contribution.author_id == user.id)
        .order_by(Contribution.created_at.desc())
    )
    if contribution_status:
        query = query.where(Contribution.status == contribution_status)
    return list(db.scalars(query))


@router.post(
    "/contributions",
    response_model=ContributionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_contribution(
    payload: ContributionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contribution:
    validate_taxonomy(db, payload)
    contribution = Contribution(author_id=user.id, **payload.model_dump())
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution


@router.get("/contributions/{contribution_id}", response_model=ContributionRead)
def get_contribution(
    contribution_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contribution:
    return owned_contribution(db, contribution_id, user)


@router.get(
    "/contributions/{contribution_id}/assets",
    response_model=list[AssetRead],
)
def list_assets(
    contribution_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    contribution = owned_contribution(db, contribution_id, user)
    return contribution.assets


@router.post(
    "/contributions/{contribution_id}/consent",
    response_model=ConsentRead,
    status_code=status.HTTP_201_CREATED,
)
def record_consent(
    contribution_id: uuid.UUID,
    payload: ConsentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Consent:
    contribution = owned_contribution(db, contribution_id, user)
    if contribution.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author can consent")
    if contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Contribution is no longer editable")
    if contribution.consent:
        raise HTTPException(status.HTTP_409_CONFLICT, "Consent is already recorded")
    consent = Consent(
        contributor_id=user.id,
        contribution_id=contribution.id,
        accepted_at=datetime.now(UTC),
        **payload.model_dump(),
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


@router.post(
    "/translations",
    response_model=TranslationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_translation(
    payload: TranslationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TranslationPair:
    contribution = owned_contribution(db, payload.contribution_id, user)
    if contribution.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author can edit")
    if contribution.contribution_type != "translation":
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Contribution type must be translation",
        )
    if contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Contribution is no longer editable")
    if contribution.translation:
        raise HTTPException(status.HTTP_409_CONFLICT, "Translation already exists")
    translation = TranslationPair(**payload.model_dump())
    db.add(translation)
    db.commit()
    db.refresh(translation)
    return translation


@router.get("/translations/{translation_id}", response_model=TranslationRead)
def get_translation(
    translation_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TranslationPair:
    translation = db.get(TranslationPair, translation_id)
    if translation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Translation not found")
    owned_contribution(db, translation.contribution_id, user)
    return translation


@router.post(
    "/contributions/{contribution_id}/submit",
    response_model=ContributionRead,
)
def submit_contribution(
    contribution_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Contribution:
    contribution = owned_contribution(db, contribution_id, user)
    if contribution.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author can submit")
    if contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only drafts can be submitted")
    missing: list[str] = []
    if contribution.consent is None:
        missing.append("consent")
    if contribution.contribution_type == "translation" and contribution.translation is None:
        missing.append("translation")
    if contribution.contribution_type in {"conversation", "dialogue"}:
        if contribution.conversation is None:
            missing.append("conversation")
        elif not contribution.conversation.turns:
            missing.append("conversation_turns")
    if contribution.contribution_type in {
        "audio_recording",
        "pronunciation",
        "image",
        "labeled_image",
        "video",
        "document",
    } and not contribution.assets:
        missing.append("asset")
    if contribution.contribution_type == "labeled_image" and contribution.assets:
        asset_ids = [asset.id for asset in contribution.assets]
        annotation_count = db.scalar(
            select(func.count())
            .select_from(ImageAnnotation)
            .where(ImageAnnotation.asset_id.in_(asset_ids))
        )
        if not annotation_count:
            missing.append("image_annotation")
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            {"message": "Contribution is incomplete", "missing": missing},
        )
    contribution.status = "submitted"
    contribution.submitted_at = datetime.now(UTC)
    db.commit()
    db.refresh(contribution)
    return contribution
