# Vercel deployment

Create two Vercel projects from the same repository.

## API project

Set the project root directory to `api`. Vercel discovers the FastAPI instance
through `[tool.vercel]` in `pyproject.toml`:

```toml
[tool.vercel]
entrypoint = "app.main:app"
```

Do not add `app/main.py` to the `functions` object in `vercel.json`. The
`tool.vercel.entrypoint` setting is the source of truth, and a second function
glob can fail validation before FastAPI discovery in a monorepo.

Configure these environment variables for Preview and Production:

- `DATABASE_URL`
- `JWT_SECRET`
- `WEB_ORIGINS`
- `R2_ENDPOINT_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

Use a pooled PostgreSQL connection URL suitable for serverless functions.
Database migrations are an explicit release step and must not run during every
function cold start.

Local Vercel development requires CLI 48.1.8 or newer:

```powershell
cd api
vercel dev
```

## Web project

Set the project root directory to `web` and configure:

```text
NEXT_PUBLIC_API_URL=https://your-api-project.vercel.app/api/v1
```

Set the API project's `WEB_ORIGINS` to the deployed web origin. Preview origins
should be added deliberately; do not use `*` with credentialed CORS.
