from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.database import Base, get_db
from app.main import app
from app.models.user import Role, User

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, expire_on_commit=False)


def override_db() -> Generator[Session, None, None]:
    with TestingSession() as session:
        yield session


app.dependency_overrides[get_db] = override_db
client = TestClient(app)


def setup_function() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


def register() -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "contributor@example.com",
            "full_name": "Test Contributor",
            "password": "a-secure-test-password",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_registration_login_and_me() -> None:
    registration = register()
    assert registration["user"]["roles"] == ["contributor"]

    token = registration["access_token"]
    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "contributor@example.com"

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "CONTRIBUTOR@example.com",
            "password": "a-secure-test-password",
        },
    )
    assert login.status_code == 200


def test_contributor_cannot_create_language() -> None:
    token = register()["access_token"]
    response = client.post(
        "/api/v1/languages",
        json={"name": "Setswana"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_can_create_and_public_can_list_language() -> None:
    registration = register()
    with TestingSession() as db:
        user = db.scalar(select(User).where(User.email == "contributor@example.com"))
        admin = Role(name="admin", description="Manages platform data")
        db.add(admin)
        assert user is not None
        user.roles.append(admin)
        db.commit()

    response = client.post(
        "/api/v1/languages",
        json={"name": "Setswana", "local_name": "Setswana", "iso_code": "tsn"},
        headers={"Authorization": f"Bearer {registration['access_token']}"},
    )
    assert response.status_code == 201

    public_list = client.get("/api/v1/languages")
    assert public_list.status_code == 200
    assert public_list.json()[0]["name"] == "Setswana"
