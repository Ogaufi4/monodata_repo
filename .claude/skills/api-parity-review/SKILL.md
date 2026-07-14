---
name: api-parity-review
description: Review Next.js API migration parity against the existing FastAPI backend. Use when comparing web/src/app/api/v1 handlers to api/app/api/routes, api/app/schemas, and api/app/models for behavior, response, auth, role, and error compatibility.
---

# API Parity Review

Compare migrated Next.js handlers against the FastAPI implementation before marking an endpoint complete.

## Review Sources

- Treat `api/app/api/routes` as the behavioral source of truth.
- Treat `api/app/schemas` as the JSON contract source of truth.
- Treat `api/app/models` as the relationship, default, and constraint source of truth.
- Review migrated handlers in `web/src/app/api/v1`.

## Checklist

- Confirm route path, HTTP method, query parameters, request body, response body, and status code match.
- Confirm JSON stays snake_case and errors use the current `detail` shape.
- Confirm authentication failures, inactive users, role checks, and owned-resource checks match FastAPI behavior.
- Confirm database writes happen transactionally where FastAPI commits related changes together.
- Confirm edge cases match: duplicate records, unknown IDs, invalid taxonomy links, non-draft edits, incomplete contribution submission, and duplicate coin awards.
- Confirm frontend callers using `web/src/lib/api.ts` and authenticated fetch helpers still work.

## Output

- Lead with blocking parity gaps.
- Include file references for both old and new implementations.
- Mark an endpoint complete only when behavior, persistence, and tests agree.
