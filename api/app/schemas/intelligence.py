import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnnotationCreate(BaseModel):
    asset_id: uuid.UUID
    label_name: str = Field(min_length=1, max_length=160)
    label_language_id: uuid.UUID | None = None
    label_translation: str | None = Field(default=None, max_length=160)
    annotation_type: Literal["classification", "bounding_box", "caption", "ocr"]
    x_min: float | None = Field(default=None, ge=0, le=100)
    y_min: float | None = Field(default=None, ge=0, le=100)
    x_max: float | None = Field(default=None, ge=0, le=100)
    y_max: float | None = Field(default=None, ge=0, le=100)
    confidence: float | None = Field(default=None, ge=0, le=1)
    is_synthetic: bool = False

    @model_validator(mode="after")
    def bounding_box_coordinates(self) -> "AnnotationCreate":
        coordinates = (self.x_min, self.y_min, self.x_max, self.y_max)
        if self.annotation_type == "bounding_box":
            if any(value is None for value in coordinates):
                raise ValueError("All bounding-box coordinates are required")
            if self.x_max <= self.x_min or self.y_max <= self.y_min:
                raise ValueError("Bounding-box maximums must exceed minimums")
        return self


class AnnotationRead(AnnotationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_by: uuid.UUID
    review_status: str
    human_verified: bool
    created_at: datetime


class SyntheticExampleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    example_type: str = Field(min_length=1, max_length=40)
    content: dict
    language_id: uuid.UUID | None = None
    synthetic_source_model: str = Field(min_length=1, max_length=160)
    prompt_used: str | None = None


class SyntheticExampleRead(SyntheticExampleCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    generated_at: datetime
    human_verified: bool
    review_status: str
    created_by: uuid.UUID


class DatasetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    language_id: uuid.UUID | None = None
    contribution_type: str | None = None
    minimum_quality_score: float | None = Field(default=None, ge=0, le=100)
    include_synthetic: bool = False


class DatasetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    filters: dict
    created_by: uuid.UUID
    created_at: datetime


class DatasetExportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    dataset_id: uuid.UUID
    export_format: str
    status: str
    item_count: int
    manifest: dict
    created_at: datetime
