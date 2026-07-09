import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.routes.contributions import owned_contribution
from app.core.database import get_db
from app.models.contribution import Contribution, ConversationThread, ConversationTurn
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetail,
    ConversationRead,
    TurnCreate,
    TurnRead,
    TurnUpdate,
)

router = APIRouter()


def editable_conversation(
    db: Session,
    conversation_id: uuid.UUID,
    user: User,
) -> ConversationThread:
    conversation = db.get(ConversationThread, conversation_id)
    if conversation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    contribution = owned_contribution(db, conversation.contribution_id, user)
    if contribution.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author can edit")
    if contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Conversation is no longer editable")
    return conversation


@router.post(
    "/conversations",
    response_model=ConversationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConversationThread:
    contribution = owned_contribution(db, payload.contribution_id, user)
    if contribution.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author can edit")
    if contribution.contribution_type not in {"conversation", "dialogue"}:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Contribution type must be conversation or dialogue",
        )
    if contribution.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "Contribution is no longer editable")
    if contribution.conversation:
        raise HTTPException(status.HTTP_409_CONFLICT, "Conversation already exists")
    conversation = ConversationThread(**payload.model_dump())
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConversationThread:
    conversation = db.get(ConversationThread, conversation_id)
    if conversation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found")
    owned_contribution(db, conversation.contribution_id, user)
    return conversation


@router.post(
    "/conversations/{conversation_id}/turns",
    response_model=TurnRead,
    status_code=status.HTTP_201_CREATED,
)
def add_turn(
    conversation_id: uuid.UUID,
    payload: TurnCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConversationTurn:
    conversation = editable_conversation(db, conversation_id, user)
    duplicate = db.scalar(
        select(ConversationTurn.id).where(
            ConversationTurn.conversation_id == conversation.id,
            ConversationTurn.turn_order == payload.turn_order,
        )
    )
    if duplicate:
        raise HTTPException(status.HTTP_409_CONFLICT, "Turn order already exists")
    turn = ConversationTurn(conversation_id=conversation.id, **payload.model_dump())
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return turn


@router.patch("/conversation-turns/{turn_id}", response_model=TurnRead)
def update_turn(
    turn_id: uuid.UUID,
    payload: TurnUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConversationTurn:
    turn = db.get(ConversationTurn, turn_id)
    if turn is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation turn not found")
    editable_conversation(db, turn.conversation_id, user)
    changes = payload.model_dump(exclude_unset=True)
    if "turn_order" in changes:
        duplicate = db.scalar(
            select(ConversationTurn.id).where(
                ConversationTurn.conversation_id == turn.conversation_id,
                ConversationTurn.turn_order == changes["turn_order"],
                ConversationTurn.id != turn.id,
            )
        )
        if duplicate:
            raise HTTPException(status.HTTP_409_CONFLICT, "Turn order already exists")
    for key, value in changes.items():
        setattr(turn, key, value)
    db.commit()
    db.refresh(turn)
    return turn


@router.delete(
    "/conversation-turns/{turn_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_turn(
    turn_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    turn = db.get(ConversationTurn, turn_id)
    if turn is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation turn not found")
    editable_conversation(db, turn.conversation_id, user)
    db.delete(turn)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
