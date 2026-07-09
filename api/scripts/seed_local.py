"""Seed a small, repeatable local-development taxonomy."""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.contribution import Category
from app.models.language import Language, LanguageGroup
from app.models.user import Role

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
