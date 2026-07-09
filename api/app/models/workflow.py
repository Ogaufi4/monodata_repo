import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Review(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reviews"

    contribution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contributions.id", ondelete="CASCADE"), index=True
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    action: Mapped[str] = mapped_column(String(30), index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    quality_score: Mapped[float | None] = mapped_column(Float)


class Wallet(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "wallets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    pending_coins: Mapped[int] = mapped_column(Integer, default=0)
    earned_coins: Mapped[int] = mapped_column(Integer, default=0)
    redeemed_coins: Mapped[int] = mapped_column(Integer, default=0)
    expired_coins: Mapped[int] = mapped_column(Integer, default=0)
    total_lifetime_coins: Mapped[int] = mapped_column(Integer, default=0)


class CoinTransaction(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "coin_transactions"

    wallet_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("wallets.id", ondelete="CASCADE"), index=True
    )
    contribution_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("contributions.id", ondelete="SET NULL"), index=True
    )
    amount: Mapped[int] = mapped_column(Integer)
    transaction_type: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default="completed")
    reason: Mapped[str] = mapped_column(String(255))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
