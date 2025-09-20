from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Template

router = APIRouter()

# Pydantic Models
class TemplateCreate(BaseModel):
    key: str
    description: str
    data_type: str
    status: str = 'Activo'

class TemplateUpdate(BaseModel):
    key: Optional[str] = None
    description: Optional[str] = None
    data_type: Optional[str] = None
    status: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class TemplateResponse(BaseModel):
    id: int
    key: str
    description: str
    data_type: str
    status: str

    class Config:
        from_attributes = True

# CRUD Endpoints

@router.get("/templates", response_model=List[TemplateResponse])
def get_all_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).all()
    return templates

@router.get("/templates/{template_id}", response_model=TemplateResponse)
def get_template_by_id(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/templates", response_model=TemplateResponse, status_code=201)
def create_template(template_data: TemplateCreate, db: Session = Depends(get_db)):
    db_template = Template(**template_data.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/templates/{template_id}", response_model=TemplateResponse)
def update_template(template_id: int, template_data: TemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)

    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/templates/{template_id}/status", response_model=TemplateResponse)
def update_template_status(template_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db_template.status = status_update.status
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/templates/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(db_template)
    db.commit()
    return {"ok": True}
