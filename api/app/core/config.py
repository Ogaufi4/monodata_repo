import json
from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BIIDP API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/biidp",
        validation_alias=AliasChoices(
            "DATABASE_URL",
            "POSTGRES_URL",
            "POSTGRES_PRISMA_URL",
            "POSTGRES_URL_NON_POOLING",
        ),
    )
    web_origins: str = "http://localhost:3000"
    r2_endpoint_url: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    storage_backend: str = "r2"
    local_storage_path: str = "./local-storage"
    local_storage_base_url: str = "http://localhost:8000"
    max_upload_bytes: int = 524_288_000
    jwt_secret: str = "development-only-change-me-at-least-32-bytes"
    access_token_minutes: int = 60
    firebase_project_id: str | None = None
    local_admin_email: str | None = None
    local_admin_password: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def web_origin_list(self) -> list[str]:
        value = self.web_origins.strip()
        if value.startswith("["):
            try:
                parsed = json.loads(value)
                return [
                    str(origin).strip()
                    for origin in parsed
                    if str(origin).strip()
                ]
            except (json.JSONDecodeError, TypeError):
                value = value.strip("[]")
        return [
            origin.strip().strip("\"'")
            for origin in value.split(",")
            if origin.strip().strip("\"'")
        ]

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg3_driver(cls, value: object) -> object:
        if isinstance(value, str):
            if value.startswith("postgres://"):
                return value.replace("postgres://", "postgresql+psycopg://", 1)
            if value.startswith("postgresql://"):
                return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
