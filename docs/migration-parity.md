# FastAPI → Next.js API migration parity checklist

The Python API (`api/`) has been ported to Next.js route handlers under
`web/src/app/api/v1`, backed by Prisma/Postgres (`web/prisma/schema.prisma`).
The `/api/v1` contract (paths, methods, status codes, snake_case fields,
`{"detail": ...}` errors, bearer JWT auth) is preserved. The FastAPI backend
remains in `api/` as reference until this checklist is fully green in
production.

Verification status refers to the end-to-end smoke suite
(`web/scripts/api-smoke.sh`, 78 checks) run against a local Postgres on
2026-07-13.

| Endpoint | Methods | Ported | Verified |
| --- | --- | --- | --- |
| `/health` | GET | ✅ | ✅ |
| `/auth/register` | POST | ✅ | ✅ (201, 409 dup, 422 validation, email lowercased, contributor role) |
| `/auth/login` | POST | ✅ | ✅ (200, 401 bad creds) — 403 inactive untested |
| `/auth/firebase` | POST | ✅ | ⚠️ untested (needs a live Firebase ID token; verifies via Google JWKS, `FIREBASE_PROJECT_ID` audience) |
| `/auth/me` | GET | ✅ | ✅ (200, 401 unauthenticated) |
| `/language-groups` | GET, POST | ✅ | ✅ (201, 409 dup) |
| `/languages` | GET, POST | ✅ | ✅ (filters, 422 unknown group, 409 dup) |
| `/languages/{id}` | GET, PATCH | ✅ | ✅ (200, 422 bad uuid, exclude-unset patch) |
| `/dialects` | GET, POST | ✅ | ✅ |
| `/speech-communities` | GET, POST | ✅ | ✅ (422 dialect without language) |
| `/categories` | GET, POST | ✅ | ✅ (403 non-admin) |
| `/contributions` | GET, POST | ✅ | ✅ (draft defaults, taxonomy 422s, author-scoped list) |
| `/contributions/{id}` | GET | ✅ | ✅ (403 foreign user) |
| `/contributions/{id}/assets` | GET | ✅ | ✅ |
| `/contributions/{id}/consent` | POST | ✅ | ✅ (201, 409 dup) |
| `/contributions/{id}/submit` | POST | ✅ | ✅ (422 `{message, missing}` detail, status transition) |
| `/contributions/{id}/review` | POST | ✅ | ✅ (201, 409 re-review, coin award + wallet update, idempotent award) |
| `/translations` | POST | ✅ | ✅ (201, 409 dup) |
| `/translations/{id}` | GET | ✅ | ✅ |
| `/conversations` | POST | ✅ | ✅ |
| `/conversations/{id}` | GET | ✅ | ✅ (turns ordered by turn_order) |
| `/conversations/{id}/turns` | POST | ✅ | ✅ (409 dup order) |
| `/conversation-turns/{id}` | PATCH, DELETE | ✅ | ✅ (200, 204) |
| `/uploads/signed-url` | POST | ✅ | ✅ (415 bad type; 413 oversize untested) |
| `/uploads/confirm` | POST | ✅ | ✅ (metadata verification, media/format mapping) |
| `/uploads/local/{token}` | PUT | ✅ | ✅ (204; local backend only) |
| `/uploads/local-download/{token}` | GET | ✅ | ✅ (content roundtrip) |
| `/uploads/assets/{id}/download-url` | GET | ✅ | ✅ |
| `/reviews/pending` | GET | ✅ | ✅ (403 non-reviewer) |
| `/wallet` | GET | ✅ | ✅ (find-or-create) |
| `/wallet/transactions` | GET | ✅ | ✅ |
| `/leaderboard` | GET | ✅ | ✅ (rank/full_name/coins) |
| `/image-annotations` | POST | ✅ | ⚠️ untested (needs an image asset; logic mirrors FastAPI incl. bounding-box validation) |
| `/image-annotations/{asset_id}` | GET | ✅ | ⚠️ untested |
| `/synthetic-examples` | GET, POST | ✅ | ✅ (public GET, admin POST) |
| `/synthetic-examples/{id}/verify` | PATCH | ✅ | ✅ |
| `/datasets` | GET, POST | ✅ | ✅ (filter snapshot, item population) |
| `/datasets/{id}/export` | POST | ✅ | ✅ (manifest, item_count) |
| `/dataset-exports` | GET | ✅ | ✅ |
| `/dataset-exports/{id}/download` | GET | ✅ | ✅ (NDJSON + Content-Disposition) |
| `/admin/analytics` | GET | ✅ | ✅ |

## Known intentional divergences

- **Validation error detail**: FastAPI returns Pydantic's list of error objects
  for 422 request-validation failures; the port returns a human-readable string
  (`"field: message"`). Status codes are identical, and the frontend only reads
  string details (`web/src/lib/client-api.ts`), so behavior is unchanged for
  the app. Domain-level 422s (e.g. `Unknown language_id`, submit's
  `{message, missing}` object) match exactly.
- **Datetime format**: `2026-01-01T00:00:00.000Z` (JS ISO, `Z`) instead of
  Python's `+00:00` offset form. Both are RFC 3339 and parse identically.
- **Upload confirm on R2**: content-type comparison lowercases both sides
  (FastAPI lowercased only the stored value). No behavioral change for the
  allowed-type list, which is already lowercase.
- **CORS**: not replicated — the API is same-origin with the frontend. If the
  legacy FastAPI origins list is still needed (e.g. `contribute.diteme.com`
  calling this deployment cross-origin), add headers in `next.config.ts`.

## Deployment prerequisites

1. `DATABASE_URL` (or `POSTGRES_URL`/`POSTGRES_PRISMA_URL`/
   `POSTGRES_URL_NON_POOLING`) — Prisma normalizes `postgresql+psycopg://`.
2. Apply the baseline schema to the target database (it was empty as of
   2026-07-13): `npx prisma migrate deploy` from `web/`.
3. `JWT_SECRET` must equal the FastAPI value so existing bearer tokens keep
   working; argon2id password hashes from pwdlib verify unchanged.
4. `FIREBASE_PROJECT_ID`, `R2_*`, `STORAGE_BACKEND`, `MAX_UPLOAD_BYTES` as in
   `web/.env.example`.
5. Frontend: `NEXT_PUBLIC_API_URL` unset → same-origin `/api/v1`; set it to
   the FastAPI URL to roll back.
