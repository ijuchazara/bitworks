from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import User, Client, Conversation, Message

router = APIRouter()

# Pydantic Models
class UserBase(BaseModel):
    username: str
    client_id: int
    status: Optional[str] = 'Activo'

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    username: Optional[str] = None
    client_id: Optional[int] = None
    status: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    # Add client details for convenience
    client_code: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

# Helper function to enrich User with client details for UserResponse
def enrich_user_response(user: User) -> UserResponse:
    client_code = user.client.client_code if user.client else None
    client_name = user.client.name if user.client else None
    return UserResponse(
        id=user.id,
        username=user.username,
        client_id=user.client_id,
        status=user.status,
        created_at=user.created_at,
        client_code=client_code,
        client_name=client_name
    )

# CRUD Endpoints

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    # Eager load client relationship to avoid N+1 queries
    users = db.query(User).options(joinedload(User.client)).all()
    return [enrich_user_response(user) for user in users]

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(joinedload(User.client)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return enrich_user_response(user)

@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Validate client_id
    client = db.query(Client).filter(Client.id == user_data.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found for the given client_id")

    # Check for existing username for the same client
    existing_user = db.query(User).filter(
        User.username == user_data.username,
        User.client_id == user_data.client_id
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this username already exists for this client")

    db_user = User(**user_data.model_dump()) # Use .model_dump() for Pydantic v2
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Reload with client for response enrichment
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == db_user.id).first()
    return enrich_user_response(db_user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True) # Use .model_dump() for Pydantic v2

    # If username or client_id is being updated, check for uniqueness
    if "username" in update_data and "client_id" in update_data:
        existing_user = db.query(User).filter(
            User.username == update_data["username"],
            User.client_id == update_data["client_id"],
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this username already exists for the target client")
    elif "username" in update_data:
        existing_user = db.query(User).filter(
            User.username == update_data["username"],
            User.client_id == db_user.client_id, # Check against current client_id
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this username already exists for the current client")
    elif "client_id" in update_data:
        # Validate new client_id if provided
        client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(status_code=400, detail="Client not found for the given client_id")
        # Also check if username already exists for the new client_id
        existing_user = db.query(User).filter(
            User.username == db_user.username,
            User.client_id == update_data["client_id"],
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this username already exists for the target client")


    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    # Reload with client for response enrichment
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == db_user.id).first()
    return enrich_user_response(db_user)

@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # TODO: Consider implications of deleting a user with associated conversations/messages
    # Depending on FK constraints, this might need adjustment (e.g., soft delete, cascade delete)
    db.delete(db_user)
    db.commit()
    return {"ok": True}

# Existing endpoints (modified response_model where applicable)

@router.get("/clients/{client_code}/users", response_model=List[UserResponse])
def get_users_for_client(client_code: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_code == client_code).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    users = db.query(User).options(joinedload(User.client)).filter(User.client_id == client.id).all()
    return [enrich_user_response(user) for user in users]

# The load_conversation endpoint is complex business logic and will be kept as is for now.
# Its response model is a dict, not a UserResponse, so no direct change needed there.
@router.get("/load_conversation", response_model=dict) # Keep as dict as it returns more than just user info
def load_conversation(client_code: str, username: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_code == client_code, Client.status == 'Activo').first()
    if not client:
        raise HTTPException(status_code=404, detail=f"Cliente con código '{client_code}' no encontrado o inactivo.")

    user = db.query(User).filter(User.username == username, User.client_id == client.id).first()

    if not user:
        user = User(username=username, client_id=client.id)
        db.add(user)
        db.commit()
        db.refresh(user)

    today = date.today()
    conversation = db.query(Conversation).filter(
        Conversation.user_id == user.id,
        Conversation.created_at >= today
    ).first()

    if not conversation:
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.created_at.desc()).first()

    messages = []
    conversation_id = None
    if conversation:
        conversation_id = conversation.id
        messages = db.query(Message).filter(Message.conversation_id == conversation.id).order_by(
            Message.timestamp).all()

    return {
        "user_id": user.id,
        "username": user.username,
        "client_id": user.client_id,
        "client_code": user.client.client_code,
        "client_name": user.client.name,
        "conversation_id": conversation_id,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
    }
