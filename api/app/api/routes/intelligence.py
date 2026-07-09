import json
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.api.routes.contributions import owned_contribution
from app.core.database import get_db
from app.models.contribution import Contribution, ContributionAsset
from app.models.intelligence import (
    Dataset,
    DatasetExport,
    DatasetItem,
    ImageAnnotation,
    SyntheticExample,
)
from app.models.language import Language
from app.models.user import User
from app.models.workflow import CoinTransaction, Wallet
from app.schemas.intelligence import (
    AnnotationCreate,
    AnnotationRead,
    DatasetCreate,
    DatasetExportRead,
    DatasetRead,
    SyntheticExampleCreate,
    SyntheticExampleRead,
)

router = APIRouter()
admin = require_roles("admin", "super_admin")
reviewer = require_roles("reviewer", "admin", "super_admin")


@router.post("/image-annotations", response_model=AnnotationRead, status_code=201)
def create_annotation(
    payload: AnnotationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ImageAnnotation:
    asset = db.get(ContributionAsset, payload.asset_id)
    if asset is None or asset.media_type != "image":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown image asset")
    contribution = owned_contribution(db, asset.contribution_id, user)
    if contribution.author_id != user.id or contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Image is no longer editable")
    annotation = ImageAnnotation(created_by=user.id, **payload.model_dump())
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.get("/image-annotations/{asset_id}", response_model=list[AnnotationRead])
def list_annotations(
    asset_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ImageAnnotation]:
    asset = db.get(ContributionAsset, asset_id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    owned_contribution(db, asset.contribution_id, user)
    return list(
        db.scalars(
            select(ImageAnnotation)
            .where(ImageAnnotation.asset_id == asset_id)
            .order_by(ImageAnnotation.created_at)
        )
    )


@router.get("/synthetic-examples", response_model=list[SyntheticExampleRead])
def synthetic_examples(
    db: Session = Depends(get_db),
) -> list[SyntheticExample]:
    return list(
        db.scalars(select(SyntheticExample).order_by(SyntheticExample.created_at.desc()))
    )


@router.post("/synthetic-examples", response_model=SyntheticExampleRead, status_code=201)
def create_synthetic_example(
    payload: SyntheticExampleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(admin),
) -> SyntheticExample:
    if payload.language_id and db.get(Language, payload.language_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown language_id")
    example = SyntheticExample(created_by=user.id, **payload.model_dump())
    db.add(example)
    db.commit()
    db.refresh(example)
    return example


@router.patch(
    "/synthetic-examples/{example_id}/verify",
    response_model=SyntheticExampleRead,
)
def verify_synthetic_example(
    example_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(reviewer),
) -> SyntheticExample:
    example = db.get(SyntheticExample, example_id)
    if example is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Synthetic example not found")
    example.human_verified = True
    example.review_status = "approved"
    db.commit()
    db.refresh(example)
    return example


@router.post("/datasets", response_model=DatasetRead, status_code=201)
def create_dataset(
    payload: DatasetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(admin),
) -> Dataset:
    filters = payload.model_dump(exclude={"name", "description"})
    filters = {key: str(value) if isinstance(value, uuid.UUID) else value for key, value in filters.items()}
    dataset = Dataset(
        name=payload.name,
        description=payload.description,
        filters=filters,
        created_by=user.id,
    )
    db.add(dataset)
    db.flush()
    query = select(Contribution).where(Contribution.status == "approved")
    if payload.language_id:
        query = query.where(Contribution.language_id == payload.language_id)
    if payload.contribution_type:
        query = query.where(Contribution.contribution_type == payload.contribution_type)
    if payload.minimum_quality_score is not None:
        query = query.where(Contribution.quality_score >= payload.minimum_quality_score)
    if not payload.include_synthetic:
        query = query.where(Contribution.is_synthetic.is_(False))
    for contribution in db.scalars(query):
        db.add(DatasetItem(dataset_id=dataset.id, contribution_id=contribution.id))
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/datasets", response_model=list[DatasetRead])
def datasets(
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> list[Dataset]:
    return list(db.scalars(select(Dataset).order_by(Dataset.created_at.desc())))


@router.post(
    "/datasets/{dataset_id}/export",
    response_model=DatasetExportRead,
    status_code=201,
)
def export_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(admin),
) -> DatasetExport:
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dataset not found")
    count = db.scalar(
        select(func.count()).select_from(DatasetItem).where(DatasetItem.dataset_id == dataset.id)
    ) or 0
    export = DatasetExport(
        dataset_id=dataset.id,
        item_count=count,
        created_by=user.id,
        manifest={
            "dataset_id": str(dataset.id),
            "name": dataset.name,
            "filters": dataset.filters,
            "generated_at": datetime.now(UTC).isoformat(),
            "human_and_synthetic_separated": True,
        },
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return export


@router.get("/dataset-exports", response_model=list[DatasetExportRead])
def dataset_exports(
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> list[DatasetExport]:
    return list(db.scalars(select(DatasetExport).order_by(DatasetExport.created_at.desc())))


@router.get("/dataset-exports/{export_id}/download")
def download_export(
    export_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> Response:
    export = db.get(DatasetExport, export_id)
    if export is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Export not found")
    contributions = db.scalars(
        select(Contribution)
        .join(DatasetItem, DatasetItem.contribution_id == Contribution.id)
        .where(DatasetItem.dataset_id == export.dataset_id)
        .order_by(Contribution.created_at)
    )
    lines = [
        json.dumps(
            {
                "contribution_id": str(item.id),
                "type": item.contribution_type,
                "title": item.title,
                "description": item.description,
                "language_id": str(item.language_id),
                "target_language_id": str(item.target_language_id) if item.target_language_id else None,
                "quality_score": item.quality_score,
                "is_synthetic": item.is_synthetic,
                "human_verified": item.human_verified,
                "license_type": item.license_type,
            },
            ensure_ascii=False,
        )
        for item in contributions
    ]
    return Response(
        "\n".join(lines),
        media_type="application/x-ndjson",
        headers={"Content-Disposition": f'attachment; filename="dataset-{export.id}.jsonl"'},
    )


@router.get("/admin/analytics")
def analytics(
    db: Session = Depends(get_db),
    _: User = Depends(admin),
) -> dict[str, object]:
    status_counts = dict(
        db.execute(
            select(Contribution.status, func.count()).group_by(Contribution.status)
        ).all()
    )
    return {
        "total_contributors": db.scalar(select(func.count()).select_from(User)) or 0,
        "total_contributions": db.scalar(select(func.count()).select_from(Contribution)) or 0,
        "approved_contributions": status_counts.get("approved", 0),
        "pending_reviews": status_counts.get("submitted", 0),
        "rejected_submissions": status_counts.get("rejected", 0),
        "languages_covered": db.scalar(
            select(func.count(func.distinct(Contribution.language_id)))
        ) or 0,
        "image_labels_created": db.scalar(select(func.count()).select_from(ImageAnnotation)) or 0,
        "synthetic_examples_created": db.scalar(select(func.count()).select_from(SyntheticExample)) or 0,
        "coins_awarded": db.scalar(select(func.coalesce(func.sum(CoinTransaction.amount), 0))) or 0,
        "dataset_exports_created": db.scalar(select(func.count()).select_from(DatasetExport)) or 0,
    }
