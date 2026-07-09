import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Contribution(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "contributions"

    author_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )
    contribution_type: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    language_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("languages.id", ondelete="RESTRICT"),
        index=True,
    )
    dialect_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("dialects.id", ondelete="SET NULL"),
    )
    target_language_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("languages.id", ondelete="SET NULL"),
        index=True,
    )
    target_dialect_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("dialects.id", ondelete="SET NULL"),
    )
    speech_community_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("speech_communities.id", ondelete="SET NULL"),
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        index=True,
    )
    domain: Mapped[str] = mapped_column(String(120))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    source: Mapped[str] = mapped_column(String(200))
    license_type: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    quality_score: Mapped[float | None] = mapped_column(Float)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False)
    human_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    consent: Mapped["Consent | None"] = relationship(
        back_populates="contribution",
        uselist=False,
        cascade="all, delete-orphan",
    )
    translation: Mapped["TranslationPair | None"] = relationship(
        back_populates="contribution",
        uselist=False,
        cascade="all, delete-orphan",
    )


class TranslationPair(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "translation_pairs"

    contribution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("contributions.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    source_text: Mapped[str] = mapped_column(Text)
    target_text: Mapped[str] = mapped_column(Text)
    context: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    contribution: Mapped[Contribution] = relationship(back_populates="translation")


class Consent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "consents"

    contributor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )
    contribution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("contributions.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    consent_version: Mapped[str] = mapped_column(String(30))
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    use_for_ai_training: Mapped[bool] = mapped_column(Boolean)
    use_for_research: Mapped[bool] = mapped_column(Boolean)
    use_for_commercial: Mapped[bool] = mapped_column(Boolean)
    allow_open_release: Mapped[bool] = mapped_column(Boolean)
    allow_attribution: Mapped[bool] = mapped_column(Boolean)

    contribution: Mapped[Contribution] = relationship(back_populates="consent")
