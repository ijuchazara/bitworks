from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel, ConfigDict
from typing import List, Dict
from datetime import datetime, date
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Conversation

router = APIRouter()

class ConversationCreate(BaseModel):
    user_id: int
    title: str

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

class MonthlyData(BaseModel):
    name: str
    data: List[int]

class ConversationsByMonthResponse(BaseModel):
    current_year: MonthlyData
    last_year: MonthlyData

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(conversation: ConversationCreate, db: Session = Depends(get_db)):
    db_conversation = Conversation(**conversation.model_dump())
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("/conversations/{user_id}", response_model=List[ConversationResponse])
def get_user_conversations(user_id: int, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter(Conversation.user_id == user_id).all()
    return conversations

@router.get("/conversations/today/{user_id}", response_model=ConversationResponse)
def get_or_create_today_conversation(user_id: int, db: Session = Depends(get_db)):
    today = date.today()
    conversation = db.query(Conversation).filter(
        Conversation.user_id == user_id,
        Conversation.created_at >= today
    ).first()

    if not conversation:
        conversation = Conversation(
            user_id=user_id,
            title=f"Conversación {today.strftime('%d/%m/%Y')}"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return conversation

@router.get("/stats/by-month", response_model=ConversationsByMonthResponse)
def get_conversations_by_month(db: Session = Depends(get_db)):
    """
    Retrieves the total number of conversations grouped by month for the current and last year.
    """
    current_year = datetime.utcnow().year
    last_year = current_year - 1

    # Query for the current year
    current_year_results = db.query(
        extract('month', Conversation.created_at).label('month'),
        func.count(Conversation.id).label('count')
    ).filter(
        extract('year', Conversation.created_at) == current_year
    ).group_by(
        extract('month', Conversation.created_at)
    ).all()

    # Query for the last year
    last_year_results = db.query(
        extract('month', Conversation.created_at).label('month'),
        func.count(Conversation.id).label('count')
    ).filter(
        extract('year', Conversation.created_at) == last_year
    ).group_by(
        extract('month', Conversation.created_at)
    ).all()

    # Format data for the chart
    current_year_counts = {result.month: result.count for result in current_year_results}
    last_year_counts = {result.month: result.count for result in last_year_results}

    data_for_current_year = [current_year_counts.get(month, 0) for month in range(1, 13)]
    data_for_last_year = [last_year_counts.get(month, 0) for month in range(1, 13)]

    return {
        "current_year": {"name": str(current_year), "data": data_for_current_year},
        "last_year": {"name": str(last_year), "data": data_for_last_year}
    }