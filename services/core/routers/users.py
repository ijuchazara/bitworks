from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
import sys
import os
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import User, Client, Communication

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
    client_code: Optional[str] = None
    client_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CommunicationResponse(BaseModel):
    id: int
    session_id: str
    message: Any
    created_at: datetime  # Added created_at field
    model_config = ConfigDict(from_attributes=True)

class UserSessionResponse(BaseModel):
    user_id: int
    username: str
    session_id: Optional[str] = None
    client_id: int
    client_code: str
    client_name: str
    communications: List[CommunicationResponse] = []
    model_config = ConfigDict(from_attributes=True)

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

# --- Static routes first ---

@router.get("/users/session", response_model=UserSessionResponse)
def get_user_session(client_code: str, username: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_code == client_code, Client.status == 'Activo').first()
    if not client:
        raise HTTPException(status_code=404, detail=f"Cliente con código '{client_code}' no encontrado o inactivo.")

    user = db.query(User).filter(User.username == username, User.client_id == client.id).first()

    if not user:
        user = User(username=username, client_id=client.id)
        db.add(user)
        db.commit()
        db.refresh(user)
        user.session_id = str(uuid.uuid4())
        db.commit()
        db.refresh(user)

    if not user.session_id:
        user.session_id = str(uuid.uuid4())
        db.commit()
        db.refresh(user)
        
    communications = db.query(Communication).filter(Communication.session_id == user.session_id).order_by(Communication.created_at.asc()).all()

    return UserSessionResponse(
        user_id=user.id,
        username=user.username,
        session_id=user.session_id,
        client_id=user.client_id,
        client_code=client.client_code,
        client_name=client.name,
        communications=communications
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).options(joinedload(User.client)).all()
    return [enrich_user_response(user) for user in users]

@router.get("/clients/{client_code}/users", response_model=List[UserResponse])
def get_users_for_client(client_code: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_code == client_code).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    users = db.query(User).options(joinedload(User.client)).filter(User.client_id == client.id).all()
    return [enrich_user_response(user) for user in users]

# --- Dynamic routes last ---

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).options(joinedload(User.client)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return enrich_user_response(user)

@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == user_data.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found for the given client_id")

    existing_user = db.query(User).filter(
        User.username == user_data.username,
        User.client_id == user_data.client_id
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this username already exists for this client")

    db_user = User(**user_data.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == db_user.id).first()
    return enrich_user_response(db_user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)

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
            User.client_id == db_user.client_id,
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this username already exists for the current client")
    elif "client_id" in update_data:
        client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(status_code=400, detail="Client not found for the given client_id")
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
    db_user = db.query(User).options(joinedload(User.client)).filter(User.id == db_user.id).first()
    return enrich_user_response(db_user)

@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.delete(db_user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,  # Conflict
            detail="Cannot delete user: It is still referenced by communications."
        )
