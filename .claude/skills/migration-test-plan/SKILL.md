---
name: migration-test-plan
description: Build or review the test plan for the FastAPI-to-Next.js backend migration. Use when adding tests for web/src/app/api/v1 parity across auth, taxonomy, contributions, conversations, uploads, reviews, wallets, datasets, exports, analytics, and frontend API compatibility.
---

# Migration Test Plan

Use tests to prove API parity before retiring the Python backend.

## Test Sources

- Start from current FastAPI tests in `api/tests`.
- Expand coverage using behavior from `api/app/api/routes`.
- Verify request and response shapes against `api/app/schemas`.
- Exercise migrated handlers in `web/src/app/api/v1`.

## Required Scenarios

- Auth: register, login, Firebase login when configured, `/auth/me`, inactive user rejection, duplicate email rejection, and contributor role creation.
- Taxonomy: public lists, admin-only creation/update, duplicate conflicts, archived filtering, and unknown relation IDs.
- Contributions: create/list/get, ownership rules, consent, translation creation, conversation creation, turn ordering, draft-only edits, and submit completeness checks.
- Uploads: signed URL, local upload/download, R2-compatible metadata verification, asset confirmation, asset listing, and download URL authorization.
- Reviews and rewards: pending queue, approve/reject/request changes, idempotent coin awards, wallet summary, transactions, and leaderboard.
- Intelligence and datasets: image annotations, synthetic examples, verification, dataset creation, export records, JSONL download, and admin analytics.

## Acceptance

- Run `npm run typecheck` and `npm run build` from `web`.
- Prefer endpoint-level tests with seeded Postgres or an isolated test database.
- Keep strict compatibility with `/api/v1`, snake_case JSON, bearer tokens, and `detail` errors.
