---
name: next-api-migration
description: Guide the full FastAPI-to-Next.js API migration for this repo. Use when porting routes from api/app/api/routes into web/src/app/api/v1, preserving the existing /api/v1 contract, snake_case JSON, auth behavior, and frontend compatibility.
---

# Next API Migration

Port the Python API to Next.js route handlers without changing the public API contract.

## Ground Truth

- Read existing FastAPI route behavior from `api/app/api/routes`.
- Read request and response shapes from `api/app/schemas`.
- Read persistence rules from `api/app/models`.
- Implement migrated handlers under `web/src/app/api/v1`.
- Keep `web/src/lib/api.ts` compatible with same-origin `/api/v1`, while preserving `NEXT_PUBLIC_API_URL` override support during transition.

## Migration Rules

- Preserve `/api/v1/...` paths, methods, status codes, snake_case fields, and `detail` error responses.
- Keep bearer JWT authentication and role checks compatible with the current frontend token storage.
- Keep Postgres as the source of truth and use Prisma for the new TypeScript data layer.
- Port endpoint groups in dependency order: health/config, auth/users/roles, taxonomy, contributions, conversations/translations, uploads/assets, reviews/wallets, intelligence/datasets/analytics.
- Extract shared helpers for auth, JSON responses, validation, role guards, owned-contribution checks, taxonomy validation, and transactions.

## Done Criteria

- Current frontend pages can call the Next.js API without endpoint rewrites beyond the base API URL default.
- Each migrated endpoint has parity coverage or an explicit parity checklist entry.
- The old `api/` backend remains available as reference until the Next.js API passes parity checks.
