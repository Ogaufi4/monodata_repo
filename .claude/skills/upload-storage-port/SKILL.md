---
name: upload-storage-port
description: Guide migration of upload and object storage behavior from FastAPI to Next.js. Use when porting api/app/services/storage.py and api/app/api/routes/uploads.py into web/src/app/api/v1, including R2/local storage, signed upload URLs, metadata verification, and asset download URLs.
---

# Upload Storage Port

Port upload behavior exactly before changing storage design.

## Source Files

- Read storage implementations from `api/app/services/storage.py`.
- Read upload route behavior from `api/app/api/routes/uploads.py`.
- Read asset models from `api/app/models`.
- Implement Next.js route handlers under `web/src/app/api/v1`.

## Compatibility Rules

- Preserve signed upload request and response fields.
- Preserve upload confirmation token claims, expiry, JWT algorithm, and user/contribution checks.
- Preserve allowed content types, media type mapping, file format mapping, safe filename behavior, and max upload byte checks.
- Preserve draft-only asset creation and owned-contribution access checks.
- Verify object metadata before creating an asset record.
- Preserve local development upload/download endpoints and R2 signed URL behavior.

## Validation

- Test signed URL creation rejects unsupported content types and oversized files.
- Test confirmation rejects missing objects, mismatched content type, mismatched size, expired tokens, wrong users, and non-draft contributions.
- Test confirmed assets appear from `/contributions/{id}/assets` and download URLs require contribution access.
