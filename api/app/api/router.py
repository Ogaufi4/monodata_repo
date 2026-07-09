from fastapi import APIRouter

from app.api.routes import auth, health, languages

api_router = APIRouter()
api_router.include_router(health.router, tags=["system"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(languages.router, tags=["languages"])
