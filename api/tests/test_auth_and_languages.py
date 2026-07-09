from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.database import Base, get_db
from app.core.config import Settings
from app.core.security import hash_password
from app.main import app
from app.api.routes.uploads import ALLOWED_CONTENT_TYPES, storage_or_503
from app.models.user import Role, User
from app.models.contribution import Category
from app.models.language import Language

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=engine, expire_on_commit=False)


def test_postgres_urls_use_the_installed_psycopg3_driver() -> None:
    settings = Settings(database_url="postgresql://user:pass@example.com/db")
    assert settings.database_url.startswith("postgresql+psycopg://")


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


def test_translation_requires_consent_and_content_before_submission() -> None:
    registration = register()
    token = registration["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with TestingSession() as db:
        language = Language(name="Setswana", local_name="Setswana", iso_code="tsn")
        target = Language(name="English", local_name="English", iso_code="eng")
        category = Category(name="Everyday speech", description="Common expressions")
        db.add_all([language, target, category])
        db.commit()
        language_id = str(language.id)
        target_id = str(target.id)
        category_id = str(category.id)

    draft = client.post(
        "/api/v1/contributions",
        headers=headers,
        json={
            "contribution_type": "translation",
            "title": "Greeting",
            "description": "A common morning greeting",
            "language_id": language_id,
            "target_language_id": target_id,
            "category_id": category_id,
            "domain": "daily life",
            "tags": ["greeting"],
            "source": "first-hand speaker knowledge",
            "license_type": "CC BY 4.0",
        },
    )
    assert draft.status_code == 201
    contribution_id = draft.json()["id"]

    incomplete = client.post(
        f"/api/v1/contributions/{contribution_id}/submit",
        headers=headers,
    )
    assert incomplete.status_code == 422
    assert set(incomplete.json()["detail"]["missing"]) == {"consent", "translation"}

    translation = client.post(
        "/api/v1/translations",
        headers=headers,
        json={
            "contribution_id": contribution_id,
            "source_text": "Dumela",
            "target_text": "Hello",
            "context": "A general greeting",
        },
    )
    assert translation.status_code == 201

    consent = client.post(
        f"/api/v1/contributions/{contribution_id}/consent",
        headers=headers,
        json={
            "consent_version": "1.0",
            "use_for_ai_training": True,
            "use_for_research": True,
            "use_for_commercial": False,
            "allow_open_release": True,
            "allow_attribution": True,
        },
    )
    assert consent.status_code == 201

    submitted = client.post(
        f"/api/v1/contributions/{contribution_id}/submit",
        headers=headers,
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "submitted"


def test_conversation_requires_turns_and_preserves_order() -> None:
    registration = register()
    headers = {"Authorization": f"Bearer {registration['access_token']}"}

    with TestingSession() as db:
        language = Language(name="Sekgalagadi", iso_code="xkv")
        target = Language(name="English", iso_code="eng")
        category = Category(name="Community dialogue")
        db.add_all([language, target, category])
        db.commit()
        language_id = str(language.id)
        target_id = str(target.id)
        category_id = str(category.id)

    draft = client.post(
        "/api/v1/contributions",
        headers=headers,
        json={
            "contribution_type": "conversation",
            "title": "At the kgotla",
            "description": "A short community dialogue",
            "language_id": language_id,
            "target_language_id": target_id,
            "category_id": category_id,
            "domain": "community",
            "source": "Contributor knowledge",
            "license_type": "CC BY 4.0",
        },
    )
    assert draft.status_code == 201
    contribution_id = draft.json()["id"]

    conversation = client.post(
        "/api/v1/conversations",
        headers=headers,
        json={
            "contribution_id": contribution_id,
            "speaker_count": 2,
            "context": "A village meeting",
        },
    )
    assert conversation.status_code == 201
    conversation_id = conversation.json()["id"]

    missing_turns = client.post(
        f"/api/v1/contributions/{contribution_id}/submit",
        headers=headers,
    )
    assert "conversation_turns" in missing_turns.json()["detail"]["missing"]

    for order, speaker, source, target_text in (
        (1, "Speaker A", "Dumelang", "Hello everyone"),
        (2, "Speaker B", "Dumela", "Hello"),
    ):
        turn = client.post(
            f"/api/v1/conversations/{conversation_id}/turns",
            headers=headers,
            json={
                "turn_order": order,
                "speaker_label": speaker,
                "source_text": source,
                "target_text": target_text,
            },
        )
        assert turn.status_code == 201

    detail = client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers=headers,
    )
    assert [turn["turn_order"] for turn in detail.json()["turns"]] == [1, 2]

    consent = client.post(
        f"/api/v1/contributions/{contribution_id}/consent",
        headers=headers,
        json={
            "consent_version": "1.0",
            "use_for_ai_training": True,
            "use_for_research": True,
            "use_for_commercial": False,
            "allow_open_release": True,
            "allow_attribution": True,
        },
    )
    assert consent.status_code == 201

    submitted = client.post(
        f"/api/v1/contributions/{contribution_id}/submit",
        headers=headers,
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "submitted"


def test_signed_upload_is_verified_before_asset_creation() -> None:
    class FakeStorage:
        metadata: dict[str, dict[str, object]] = {}

        def create_upload_url(
            self, storage_key: str, content_type: str, expires_in: int
        ) -> str:
            return f"https://uploads.example.test/{storage_key}"

        def object_metadata(self, storage_key: str) -> dict[str, object]:
            return self.metadata[storage_key]

    fake_storage = FakeStorage()
    app.dependency_overrides[storage_or_503] = lambda: fake_storage
    try:
        registration = register()
        headers = {"Authorization": f"Bearer {registration['access_token']}"}
        with TestingSession() as db:
            language = Language(name="Setswana", iso_code="tsn")
            category = Category(name="Pronunciation")
            db.add_all([language, category])
            db.commit()
            language_id = str(language.id)
            category_id = str(category.id)

        draft = client.post(
            "/api/v1/contributions",
            headers=headers,
            json={
                "contribution_type": "audio_recording",
                "title": "Greeting pronunciation",
                "description": "Spoken Setswana greeting",
                "language_id": language_id,
                "category_id": category_id,
                "domain": "speech",
                "source": "Contributor recording",
                "license_type": "CC BY 4.0",
            },
        )
        contribution_id = draft.json()["id"]

        incomplete = client.post(
            f"/api/v1/contributions/{contribution_id}/submit",
            headers=headers,
        )
        assert set(incomplete.json()["detail"]["missing"]) == {"consent", "asset"}

        signed = client.post(
            "/api/v1/uploads/signed-url",
            headers=headers,
            json={
                "contribution_id": contribution_id,
                "filename": "../../greeting.webm",
                "content_type": "audio/webm",
                "file_size": 2048,
            },
        )
        assert signed.status_code == 200
        signed_body = signed.json()
        assert ".." not in signed_body["storage_key"]
        fake_storage.metadata[signed_body["storage_key"]] = {
            "ContentLength": 2048,
            "ContentType": "audio/webm",
        }

        confirmed = client.post(
            "/api/v1/uploads/confirm",
            headers=headers,
            json={
                "upload_token": signed_body["upload_token"],
                "duration": 1.5,
                "checksum": "sha256:test",
            },
        )
        assert confirmed.status_code == 201
        assert confirmed.json()["media_type"] == "audio"

        assets = client.get(
            f"/api/v1/contributions/{contribution_id}/assets",
            headers=headers,
        )
        assert assets.status_code == 200
        assert len(assets.json()) == 1

        consent = client.post(
            f"/api/v1/contributions/{contribution_id}/consent",
            headers=headers,
            json={
                "consent_version": "1.0",
                "use_for_ai_training": True,
                "use_for_research": True,
                "use_for_commercial": False,
                "allow_open_release": False,
                "allow_attribution": False,
            },
        )
        assert consent.status_code == 201
        submitted = client.post(
            f"/api/v1/contributions/{contribution_id}/submit",
            headers=headers,
        )
        assert submitted.status_code == 200
        assert submitted.json()["status"] == "submitted"
    finally:
        app.dependency_overrides.pop(storage_or_503, None)


def test_required_camera_and_browser_recording_formats_are_allowed() -> None:
    required = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
        "audio/wav",
        "audio/mpeg",
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
    }
    assert required.issubset(ALLOWED_CONTENT_TYPES)


def test_reviewer_approval_awards_contributor_coins() -> None:
    contributor = register()
    contributor_headers = {
        "Authorization": f"Bearer {contributor['access_token']}"
    }
    with TestingSession() as db:
        language = Language(name="Setswana", iso_code="tsn")
        target = Language(name="English", iso_code="eng")
        category = Category(name="Greetings")
        reviewer_role = Role(name="reviewer", description="Reviews contributions")
        reviewer_user = User(
            email="reviewer@example.com",
            full_name="Test Reviewer",
            password_hash=hash_password("reviewer-test-password"),
            roles=[reviewer_role],
        )
        db.add_all([language, target, category, reviewer_user])
        db.commit()
        language_id, target_id, category_id = (
            str(language.id),
            str(target.id),
            str(category.id),
        )

    draft = client.post(
        "/api/v1/contributions",
        headers=contributor_headers,
        json={
            "contribution_type": "translation",
            "title": "Coin test",
            "description": "Approved translation",
            "language_id": language_id,
            "target_language_id": target_id,
            "category_id": category_id,
            "domain": "daily life",
            "source": "Contributor",
            "license_type": "CC BY 4.0",
        },
    ).json()
    client.post(
        "/api/v1/translations",
        headers=contributor_headers,
        json={
            "contribution_id": draft["id"],
            "source_text": "Dumela",
            "target_text": "Hello",
        },
    )
    client.post(
        f"/api/v1/contributions/{draft['id']}/consent",
        headers=contributor_headers,
        json={
            "consent_version": "1.0",
            "use_for_ai_training": True,
            "use_for_research": True,
            "use_for_commercial": False,
            "allow_open_release": True,
            "allow_attribution": False,
        },
    )
    client.post(
        f"/api/v1/contributions/{draft['id']}/submit",
        headers=contributor_headers,
    )
    reviewer_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "reviewer@example.com",
            "password": "reviewer-test-password",
        },
    ).json()
    reviewer_headers = {
        "Authorization": f"Bearer {reviewer_login['access_token']}"
    }
    decision = client.post(
        f"/api/v1/contributions/{draft['id']}/review",
        headers=reviewer_headers,
        json={"action": "approve", "quality_score": 90, "notes": "Good"},
    )
    assert decision.status_code == 201
    wallet = client.get("/api/v1/wallet", headers=contributor_headers).json()
    assert wallet["earned_coins"] == 5
    assert wallet["total_lifetime_coins"] == 5
