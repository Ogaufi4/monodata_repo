import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

ContributionType = Literal[
    "word",
    "sentence",
    "translation",
    "conversation",
    "dialogue",
    "story",
    "proverb",
    "pronunciation",
    "dictionary_entry",
    "audio_recording",
    "image",
    "labeled_image",
    "video",
    "document",
    "object_label",
    "cultural_knowledge",
    "synthetic_example",
    "synthetic_prompt",
]


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class CategoryRead(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool


class ContributionCreate(BaseModel):
    contribution_type: ContributionType
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    language_id: uuid.UUID
    dialect_id: uuid.UUID | None = None
    target_language_id: uuid.UUID | None = None
    target_dialect_id: uuid.UUID | None = None
    speech_community_id: uuid.UUID | None = None
    category_id: uuid.UUID
    domain: str = Field(min_length=1, max_length=120)
    tags: list[str] = Field(default_factory=list, max_length=30)
    source: str = Field(min_length=1, max_length=200)
    license_type: str = Field(min_length=1, max_length=80)
    is_synthetic: bool = False

    @model_validator(mode="after")
    def translation_requires_target(self) -> "ContributionCreate":
        if self.contribution_type == "translation" and not self.target_language_id:
            raise ValueError("target_language_id is required for translations")
        return self


class ContributionRead(ContributionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    status: str
    quality_score: float | None
    human_verified: bool
    version: int
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None


class TranslationCreate(BaseModel):
    contribution_id: uuid.UUID
    source_text: str = Field(min_length=1)
    target_text: str = Field(min_length=1)
    context: str | None = None
    notes: str | None = None


class TranslationRead(TranslationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ConsentCreate(BaseModel):
    consent_version: str = Field(default="1.0", min_length=1, max_length=30)
    use_for_ai_training: bool
    use_for_research: bool
    use_for_commercial: bool
    allow_open_release: bool
    allow_attribution: bool


class ConsentRead(ConsentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    contributor_id: uuid.UUID
    contribution_id: uuid.UUID
    accepted_at: datetime
