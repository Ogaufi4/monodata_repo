from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import Role, User
from app.schemas.auth import (
    FirebaseLoginRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth")


def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=[role.name for role in user.roles],
    )


def contributor_role(db: Session) -> Role:
    contributor = db.scalar(select(Role).where(Role.name == "contributor"))
    if contributor is None:
        contributor = Role(name="contributor", description="Submits data contributions")
        db.add(contributor)
        db.flush()
    return contributor


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email is already registered")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        roles=[contributor_role(db)],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user_response(user),
    )


@router.post("/firebase", response_model=TokenResponse)
def firebase_login(
    payload: FirebaseLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    if not settings.firebase_project_id:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Firebase authentication is not configured",
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        decoded = google_id_token.verify_firebase_token(
            payload.id_token,
            google_requests.Request(),
            audience=settings.firebase_project_id,
        )
    except ImportError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Firebase authentication dependency is not installed",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Firebase token") from exc

    email = str(decoded.get("email") or "").lower()
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Firebase account has no email")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        full_name = (
            payload.full_name
            or decoded.get("name")
            or email.split("@", maxsplit=1)[0]
        )
        user = User(
            email=email,
            full_name=str(full_name).strip()[:160] or email,
            password_hash=hash_password(f"firebase:{decoded.get('user_id') or email}"),
            roles=[contributor_role(db)],
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive")

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user_response(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive")
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user_response(user),
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return user_response(user)
