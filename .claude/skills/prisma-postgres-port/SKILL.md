---
name: prisma-postgres-port
description: Guide creation or review of the Prisma/Postgres data layer for the backend migration. Use when translating SQLAlchemy models in api/app/models into Prisma schema, migrations, relations, constraints, UUIDs, JSON fields, defaults, and TypeScript data access.
---

# Prisma Postgres Port

Translate the current SQLAlchemy/Postgres model into Prisma without changing product behavior.

## Source Model

- Read table definitions from `api/app/models`.
- Cross-check field requirements with `api/app/schemas`.
- Preserve behavior expected by routes in `api/app/api/routes`.

## Schema Rules

- Use UUID primary keys compatible with the existing API ids.
- Preserve table names, relation cardinality, unique constraints, indexes, nullable fields, defaults, JSON fields, and timestamp behavior.
- Model users, roles, language taxonomy, contributions, consent, translations, conversation threads/turns, assets, reviews, wallets, coin transactions, annotations, synthetic examples, datasets, dataset items, and exports.
- Keep snake_case API fields even if Prisma model fields use idiomatic TypeScript naming; define clear mapping helpers when needed.
- Do not redesign statuses, enum values, reward amounts, or workflow transitions unless the user explicitly asks.

## Migration Rules

- Keep Postgres as the source of truth.
- Generate Prisma migrations from the final schema.
- Avoid destructive migration steps unless a data migration plan is explicit.
- Keep the Python `api/` migrations as historical reference until parity is verified.
