"""Vercel's zero-configuration FastAPI entrypoint."""

from app.main import asgi_app as app

__all__ = ["app"]
