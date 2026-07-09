import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class ImageAnnotation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "image_annotations"

    asset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contribution_assets.id", ondelete="CASCADE"), index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    label_name: Mapped[str] = mapped_column(String(160))
    label_language_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("languages.id", ondelete="SET NULL")
    )
    label_translation: Mapped[str | None] = mapped_column(String(160))
    annotation_type: Mapped[str] = mapped_column(String(30))
    x_min: Mapped[float | None] = mapped_column(Float)
    y_min: Mapped[float | None] = mapped_column(Float)
    x_max: Mapped[float | None] = mapped_column(Float)
    y_max: Mapped[float | None] = mapped_column(Float)
    confidence: Mapped[float | None] = mapped_column(Float)
    review_status: Mapped[str] = mapped_column(String(30), default="draft")
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False)
    human_verified: Mapped[bool] = mapped_column(Boolean, default=False)


class SyntheticExample(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "synthetic_examples"

    title: Mapped[str] = mapped_column(String(200))
    example_type: Mapped[str] = mapped_column(String(40), index=True)
    content: Mapped[dict] = mapped_column(JSON)
    language_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("languages.id", ondelete="SET NULL"), index=True
    )
    synthetic_source_model: Mapped[str] = mapped_column(String(160))
    prompt_used: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    human_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    review_status: Mapped[str] = mapped_column(String(30), default="pending_review")
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )


class Dataset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "datasets"

    name: Mapped[str] = mapped_column(String(200), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )


class DatasetItem(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "dataset_items"

    dataset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    contribution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contributions.id", ondelete="CASCADE"), index=True
    )


class DatasetExport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "dataset_exports"

    dataset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("datasets.id", ondelete="CASCADE"), index=True
    )
    export_format: Mapped[str] = mapped_column(String(20), default="jsonl")
    status: Mapped[str] = mapped_column(String(30), default="ready")
    item_count: Mapped[int] = mapped_column(default=0)
    manifest: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )
