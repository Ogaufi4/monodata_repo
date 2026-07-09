"""Seed a small, repeatable local-development taxonomy."""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.contribution import Category
from app.models.language import Language, LanguageGroup
from app.models.user import Role
from app.models.user import User

ROLES = {
    "contributor": "Submits data contributions",
    "reviewer": "Reviews and validates contributions",
    "admin": "Manages taxonomy, reviews, rewards, and datasets",
    "super_admin": "Manages system configuration and roles",
}

LANGUAGES = [
    ("Setswana", "Setswana", "tsn"),
    ("Sekgalagadi", "Shekgalagari", "xkv"),
    ("English", "English", "eng"),
]

CATEGORIES = [
    ("Everyday speech", "Common words, phrases, and conversations"),
    ("Cultural knowledge", "Stories, practices, proverbs, and community knowledge"),
    ("Education", "Teaching and learning material"),
]


def seed() -> None:
    with SessionLocal() as db:
        for name, description in ROLES.items():
            if db.scalar(select(Role).where(Role.name == name)) is None:
                db.add(Role(name=name, description=description))
        db.flush()

        if settings.local_admin_email and settings.local_admin_password:
            admin = db.scalar(
                select(User).where(User.email == settings.local_admin_email.lower())
            )
            admin_roles = list(
                db.scalars(
                    select(Role).where(Role.name.in_(["admin", "reviewer"]))
                )
            )
            if admin is None:
                admin = User(
                    email=settings.local_admin_email.lower(),
                    full_name="Local Administrator",
                    password_hash=hash_password(settings.local_admin_password),
                    roles=admin_roles,
                )
                db.add(admin)
            else:
                existing = {role.name for role in admin.roles}
                admin.roles.extend(role for role in admin_roles if role.name not in existing)

        group = db.scalar(
            select(LanguageGroup).where(LanguageGroup.name == "Botswana languages")
        )
        if group is None:
            group = LanguageGroup(
                name="Botswana languages",
                description="Initial local development taxonomy",
            )
            db.add(group)
            db.flush()

        for name, local_name, iso_code in LANGUAGES:
            if db.scalar(select(Language).where(Language.name == name)) is None:
                db.add(
                    Language(
                        name=name,
                        local_name=local_name,
                        iso_code=iso_code,
                        group_id=group.id,
                    )
                )

        for name, description in CATEGORIES:
            if db.scalar(select(Category).where(Category.name == name)) is None:
                db.add(Category(name=name, description=description))

        db.commit()
        print("Local roles, languages, and categories are ready.")


if __name__ == "__main__":
    seed()
