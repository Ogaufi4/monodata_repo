from fastapi import APIRouter

from app.api.routes import auth, contributions, conversations, health, languages

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(languages.router, tags=["languages"])
api_router.include_router(contributions.router, tags=["contributions"])
api_router.include_router(conversations.router, tags=["conversations"])
