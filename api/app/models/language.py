import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class LanguageGroup(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "language_groups"

    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    languages: Mapped[list["Language"]] = relationship(back_populates="group")


class Language(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "languages"
    __table_args__ = (UniqueConstraint("name", "group_id"),)

    name: Mapped[str] = mapped_column(String(120), index=True)
    local_name: Mapped[str | None] = mapped_column(String(120))
    iso_code: Mapped[str | None] = mapped_column(String(12), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("language_groups.id", ondelete="SET NULL"),
    )

    group: Mapped[LanguageGroup | None] = relationship(back_populates="languages")
    dialects: Mapped[list["Dialect"]] = relationship(back_populates="language")


class Dialect(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "dialects"
    __table_args__ = (UniqueConstraint("name", "language_id"),)

    name: Mapped[str] = mapped_column(String(120))
    local_name: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    language_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("languages.id", ondelete="CASCADE"),
        index=True,
    )

    language: Mapped[Language] = relationship(back_populates="dialects")


class SpeechCommunity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "speech_communities"

    name: Mapped[str] = mapped_column(String(160), index=True)
    district: Mapped[str | None] = mapped_column(String(120), index=True)
    village: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    language_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("languages.id", ondelete="SET NULL"),
    )
    dialect_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("dialects.id", ondelete="SET NULL"),
    )
