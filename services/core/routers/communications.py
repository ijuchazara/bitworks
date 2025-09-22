from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from pydantic import BaseModel, ConfigDict
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Communication

router = APIRouter()

class CommunicationResponse(BaseModel):
    id: int
    session_id: str
    message: Any
    model_config = ConfigDict(from_attributes=True)

@router.get("/{session_id}", response_model=List[CommunicationResponse])
def get_communications_by_session(session_id: str, db: Session = Depends(get_db)):
    communications = db.query(Communication).filter(Communication.session_id == session_id).order_by(Communication.id).all()
    return communications
