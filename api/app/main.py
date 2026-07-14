from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

LOCAL_WEB_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

PRODUCTION_WEB_ORIGINS = [
    "https://contribute.diteme.com",
    "https://monodata-repo-next-577l131qh-ogauras-projects.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for Botswana's indigenous data contribution platform.",
)

allowed_origins = list(
    dict.fromkeys(
        [
            *settings.web_origin_list,
            *LOCAL_WEB_ORIGINS,
            *PRODUCTION_WEB_ORIGINS,
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"name": settings.app_name, "docs": "/docs"}


asgi_app = CORSMiddleware(
    app=app,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
