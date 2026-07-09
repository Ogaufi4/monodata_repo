import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ReviewRequest(BaseModel):
    action: Literal["approve", "reject", "request_changes"]
    notes: str | None = None
    quality_score: float | None = Field(default=None, ge=0, le=100)


class ReviewRead(ReviewRequest):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    contribution_id: uuid.UUID
    reviewer_id: uuid.UUID
    created_at: datetime


class WalletRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    pending_coins: int
    earned_coins: int
    redeemed_coins: int
    expired_coins: int
    total_lifetime_coins: int


class CoinTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    wallet_id: uuid.UUID
    contribution_id: uuid.UUID | None
    amount: int
    transaction_type: str
    status: str
    reason: str
    created_at: datetime
