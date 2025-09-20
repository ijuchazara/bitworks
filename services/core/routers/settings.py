from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Setting

router = APIRouter()

# Pydantic Models
class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None

class SettingResponse(SettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True # Use orm_mode = True for Pydantic v1

# CRUD Endpoints

@router.get("/settings", response_model=List[SettingResponse])
def get_all_settings(db: Session = Depends(get_db)):
    settings = db.query(Setting).all()
    return settings

@router.get("/settings/{setting_id}", response_model=SettingResponse)
def get_setting_by_id(setting_id: int, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/settings", response_model=SettingResponse, status_code=201)
def create_setting(setting_data: SettingCreate, db: Session = Depends(get_db)):
    existing_setting = db.query(Setting).filter(Setting.key == setting_data.key).first()
    if existing_setting:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")

    db_setting = Setting(**setting_data.model_dump()) # Use .model_dump() for Pydantic v2
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.put("/settings/{setting_id}", response_model=SettingResponse)
def update_setting(setting_id: int, setting_data: SettingUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(Setting).filter(Setting.id == setting_id).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    update_data = setting_data.model_dump(exclude_unset=True) # Use .model_dump() for Pydantic v2
    for key, value in update_data.items():
        setattr(db_setting, key, value)

    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.delete("/settings/{setting_id}", status_code=204)
def delete_setting(setting_id: int, db: Session = Depends(get_db)):
    db_setting = db.query(Setting).filter(Setting.id == setting_id).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(db_setting)
    db.commit()
    return {"ok": True}
