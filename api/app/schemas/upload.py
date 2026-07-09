import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SignedUploadRequest(BaseModel):
    contribution_id: uuid.UUID
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=120)
    file_size: int = Field(gt=0)


class SignedUploadResponse(BaseModel):
    upload_url: str
    upload_token: str
    storage_key: str
    expires_in: int
    required_headers: dict[str, str]


class ConfirmUploadRequest(BaseModel):
    upload_token: str
    checksum: str | None = Field(default=None, max_length=128)
    duration: float | None = Field(default=None, ge=0)


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    contribution_id: uuid.UUID
    uploaded_by: uuid.UUID
    storage_key: str
    original_filename: str
    media_type: str
    content_type: str
    file_size: int
    checksum: str | None
    duration: float | None
    file_format: str
    status: str
    created_at: datetime
