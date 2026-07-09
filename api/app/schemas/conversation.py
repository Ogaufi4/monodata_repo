import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    contribution_id: uuid.UUID
    speaker_count: int = Field(ge=1, le=20)
    context: str | None = None


class ConversationRead(ConversationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TurnCreate(BaseModel):
    turn_order: int = Field(ge=1)
    speaker_label: str = Field(min_length=1, max_length=80)
    speaker_role: str | None = Field(default=None, max_length=80)
    source_text: str = Field(min_length=1)
    target_text: str | None = None
    notes: str | None = None


class TurnUpdate(BaseModel):
    turn_order: int | None = Field(default=None, ge=1)
    speaker_label: str | None = Field(default=None, min_length=1, max_length=80)
    speaker_role: str | None = Field(default=None, max_length=80)
    source_text: str | None = Field(default=None, min_length=1)
    target_text: str | None = None
    notes: str | None = None


class TurnRead(TurnCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    review_status: str
    created_at: datetime
    updated_at: datetime


class ConversationDetail(ConversationRead):
    turns: list[TurnRead]
