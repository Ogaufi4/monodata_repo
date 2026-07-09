import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TaxonomyBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    is_active: bool = True


class LanguageGroupCreate(TaxonomyBase):
    pass


class LanguageGroupRead(TaxonomyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class LanguageCreate(TaxonomyBase):
    local_name: str | None = Field(default=None, max_length=120)
    iso_code: str | None = Field(default=None, max_length=12)
    group_id: uuid.UUID | None = None


class LanguageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    local_name: str | None = Field(default=None, max_length=120)
    iso_code: str | None = Field(default=None, max_length=12)
    description: str | None = None
    group_id: uuid.UUID | None = None
    is_active: bool | None = None


class LanguageRead(LanguageCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class DialectCreate(TaxonomyBase):
    language_id: uuid.UUID
    local_name: str | None = Field(default=None, max_length=120)


class DialectRead(DialectCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class SpeechCommunityCreate(TaxonomyBase):
    district: str | None = Field(default=None, max_length=120)
    village: str | None = Field(default=None, max_length=120)
    language_id: uuid.UUID | None = None
    dialect_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def dialect_requires_language(self) -> "SpeechCommunityCreate":
        if self.dialect_id and not self.language_id:
            raise ValueError("language_id is required when dialect_id is provided")
        return self


class SpeechCommunityRead(SpeechCommunityCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
