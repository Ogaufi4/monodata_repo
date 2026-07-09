from functools import lru_cache
from typing import Protocol

import boto3
from botocore.config import Config

from app.core.config import settings


class ObjectStorage(Protocol):
    def create_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int,
    ) -> str: ...

    def object_metadata(self, storage_key: str) -> dict[str, object]: ...


class R2Storage:
    def __init__(self) -> None:
        missing = [
            name
            for name, value in {
                "R2_ENDPOINT_URL": settings.r2_endpoint_url,
                "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
                "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
                "R2_BUCKET_NAME": settings.r2_bucket_name,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"Object storage is not configured: {', '.join(missing)}")
        self.bucket = settings.r2_bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

    def create_upload_url(
        self,
        storage_key: str,
        content_type: str,
        expires_in: int,
    ) -> str:
        return self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.bucket,
                "Key": storage_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    def object_metadata(self, storage_key: str) -> dict[str, object]:
        return self.client.head_object(Bucket=self.bucket, Key=storage_key)


@lru_cache
def get_storage() -> ObjectStorage:
    return R2Storage()
