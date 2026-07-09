import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.core.database import get_db
from app.models.contribution import Contribution
from app.models.user import User
from app.models.workflow import CoinTransaction, Review, Wallet
from app.schemas.contribution import ContributionRead
from app.schemas.workflow import (
    CoinTransactionRead,
    ReviewRead,
    ReviewRequest,
    WalletRead,
)

router = APIRouter()
reviewer = require_roles("reviewer", "admin", "super_admin")

COIN_AWARDS = {
    "translation": 5,
    "conversation": 20,
    "dialogue": 20,
    "audio_recording": 10,
    "pronunciation": 10,
    "story": 20,
    "image": 5,
    "labeled_image": 8,
    "video": 30,
    "document": 10,
}


def user_wallet(db: Session, user_id: uuid.UUID) -> Wallet:
    wallet = db.scalar(select(Wallet).where(Wallet.user_id == user_id))
    if wallet is None:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        db.flush()
    return wallet


@router.get("/reviews/pending", response_model=list[ContributionRead])
def pending_reviews(
    db: Session = Depends(get_db),
    _: User = Depends(reviewer),
) -> list[Contribution]:
    return list(
        db.scalars(
            select(Contribution)
            .where(Contribution.status == "submitted")
            .order_by(Contribution.submitted_at)
        )
    )


@router.post(
    "/contributions/{contribution_id}/review",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def review_contribution(
    contribution_id: uuid.UUID,
    payload: ReviewRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(reviewer),
) -> Review:
    contribution = db.get(Contribution, contribution_id)
    if contribution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contribution not found")
    if contribution.status not in {"submitted", "pending_review"}:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Contribution cannot be reviewed from status {contribution.status}",
        )

    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "request_changes": "needs_changes",
    }
    contribution.status = status_map[payload.action]
    contribution.quality_score = payload.quality_score
    review = Review(
        contribution_id=contribution.id,
        reviewer_id=actor.id,
        **payload.model_dump(),
    )
    db.add(review)

    if payload.action == "approve":
        already_awarded = db.scalar(
            select(CoinTransaction.id).where(
                CoinTransaction.contribution_id == contribution.id,
                CoinTransaction.transaction_type == "award",
            )
        )
        if not already_awarded:
            amount = COIN_AWARDS.get(contribution.contribution_type, 5)
            wallet = user_wallet(db, contribution.author_id)
            wallet.earned_coins += amount
            wallet.total_lifetime_coins += amount
            db.add(
                CoinTransaction(
                    wallet_id=wallet.id,
                    contribution_id=contribution.id,
                    amount=amount,
                    transaction_type="award",
                    reason=f"Approved {contribution.contribution_type}",
                    approved_by=actor.id,
                )
            )
    db.commit()
    db.refresh(review)
    return review


@router.get("/wallet", response_model=WalletRead)
def get_wallet(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Wallet:
    wallet = user_wallet(db, user.id)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.get("/wallet/transactions", response_model=list[CoinTransactionRead])
def wallet_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[CoinTransaction]:
    wallet = user_wallet(db, user.id)
    db.commit()
    return list(
        db.scalars(
            select(CoinTransaction)
            .where(CoinTransaction.wallet_id == wallet.id)
            .order_by(CoinTransaction.created_at.desc())
        )
    )


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    rows = db.execute(
        select(User.full_name, Wallet.total_lifetime_coins)
        .join(Wallet, Wallet.user_id == User.id)
        .where(Wallet.total_lifetime_coins > 0)
        .order_by(Wallet.total_lifetime_coins.desc())
        .limit(50)
    ).all()
    return [
        {"rank": index, "full_name": name, "coins": coins}
        for index, (name, coins) in enumerate(rows, start=1)
    ]
