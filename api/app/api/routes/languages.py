import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.database import get_db
from app.models.language import Dialect, Language, LanguageGroup, SpeechCommunity
from app.models.user import User
from app.schemas.language import (
    DialectCreate,
    DialectRead,
    LanguageCreate,
    LanguageGroupCreate,
    LanguageGroupRead,
    LanguageRead,
    LanguageUpdate,
    SpeechCommunityCreate,
    SpeechCommunityRead,
)

router = APIRouter()
admin = require_roles("admin", "super_admin")


def commit_or_conflict(db: Session, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail)


@router.get("/language-groups", response_model=list[LanguageGroupRead])
def list_groups(
    include_archived: bool = False,
    db: Session = Depends(get_db),
) -> list[LanguageGroup]:
    query = select(LanguageGroup).order_by(LanguageGroup.name)
    if not include_archived:
        query = query.where(LanguageGroup.is_active.is_(True))
    return list(db.scalars(query))


@router.post(
    "/language-groups",
    response_model=LanguageGroupRead,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    payload: LanguageGroupCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> LanguageGroup:
    group = LanguageGroup(**payload.model_dump())
    db.add(group)
    commit_or_conflict(db, "A language group with this name already exists")
    db.refresh(group)
    return group


@router.get("/languages", response_model=list[LanguageRead])
def list_languages(
    group_id: uuid.UUID | None = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
) -> list[Language]:
    query = select(Language).order_by(Language.name)
    if group_id:
        query = query.where(Language.group_id == group_id)
    if not include_archived:
        query = query.where(Language.is_active.is_(True))
    return list(db.scalars(query))


@router.get("/languages/{language_id}", response_model=LanguageRead)
def get_language(language_id: uuid.UUID, db: Session = Depends(get_db)) -> Language:
    language = db.get(Language, language_id)
    if language is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Language not found")
    return language


@router.post("/languages", response_model=LanguageRead, status_code=status.HTTP_201_CREATED)
def create_language(
    payload: LanguageCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> Language:
    if payload.group_id and db.get(LanguageGroup, payload.group_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown group_id")
    language = Language(**payload.model_dump())
    db.add(language)
    commit_or_conflict(db, "This language already exists in the selected group")
    db.refresh(language)
    return language


@router.patch("/languages/{language_id}", response_model=LanguageRead)
def update_language(
    language_id: uuid.UUID,
    payload: LanguageUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> Language:
    language = db.get(Language, language_id)
    if language is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Language not found")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("group_id") and db.get(LanguageGroup, changes["group_id"]) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown group_id")
    for key, value in changes.items():
        setattr(language, key, value)
    commit_or_conflict(db, "This language already exists in the selected group")
    db.refresh(language)
    return language


@router.get("/dialects", response_model=list[DialectRead])
def list_dialects(
    language_id: uuid.UUID | None = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
) -> list[Dialect]:
    query = select(Dialect).order_by(Dialect.name)
    if language_id:
        query = query.where(Dialect.language_id == language_id)
    if not include_archived:
        query = query.where(Dialect.is_active.is_(True))
    return list(db.scalars(query))


@router.post("/dialects", response_model=DialectRead, status_code=status.HTTP_201_CREATED)
def create_dialect(
    payload: DialectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> Dialect:
    if db.get(Language, payload.language_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown language_id")
    dialect = Dialect(**payload.model_dump())
    db.add(dialect)
    commit_or_conflict(db, "This dialect already exists for the selected language")
    db.refresh(dialect)
    return dialect


@router.get("/speech-communities", response_model=list[SpeechCommunityRead])
def list_communities(
    language_id: uuid.UUID | None = None,
    district: str | None = Query(default=None, max_length=120),
    include_archived: bool = False,
    db: Session = Depends(get_db),
) -> list[SpeechCommunity]:
    query = select(SpeechCommunity).order_by(SpeechCommunity.name)
    if language_id:
        query = query.where(SpeechCommunity.language_id == language_id)
    if district:
        query = query.where(SpeechCommunity.district == district)
    if not include_archived:
        query = query.where(SpeechCommunity.is_active.is_(True))
    return list(db.scalars(query))


@router.post(
    "/speech-communities",
    response_model=SpeechCommunityRead,
    status_code=status.HTTP_201_CREATED,
)
def create_community(
    payload: SpeechCommunityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> SpeechCommunity:
    if payload.language_id and db.get(Language, payload.language_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown language_id")
    if payload.dialect_id:
        dialect = db.get(Dialect, payload.dialect_id)
        if dialect is None or dialect.language_id != payload.language_id:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "dialect_id does not belong to language_id",
            )
    community = SpeechCommunity(**payload.model_dump())
    db.add(community)
    db.commit()
    db.refresh(community)
    return community
