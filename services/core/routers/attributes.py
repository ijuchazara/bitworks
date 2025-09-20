from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Attribute, Template, Client

router = APIRouter()

# Pydantic Models
class AttributeBase(BaseModel):
    client_id: int
    template_id: int
    value: str

class AttributeCreate(AttributeBase):
    pass

class AttributeUpdate(BaseModel):
    value: str

class AttributeResponse(AttributeBase):
    id: int
    updated_at: datetime
    # Add related details for convenience
    client_code: Optional[str] = None
    client_name: Optional[str] = None
    template_key: Optional[str] = None
    template_description: Optional[str] = None
    template_data_type: Optional[str] = None

    class Config:
        from_attributes = True

# Helper function to enrich Attribute with client and template details for AttributeResponse
def enrich_attribute_response(attribute: Attribute) -> AttributeResponse:
    client_code = attribute.client.client_code if attribute.client else None
    client_name = attribute.client.name if attribute.client else None
    template_key = attribute.template.key if attribute.template else None
    template_description = attribute.template.description if attribute.template else None
    template_data_type = attribute.template.data_type if attribute.template else None

    return AttributeResponse(
        id=attribute.id,
        client_id=attribute.client_id,
        template_id=attribute.template_id,
        value=attribute.value,
        updated_at=attribute.updated_at,
        client_code=client_code,
        client_name=client_name,
        template_key=template_key,
        template_description=template_description,
        template_data_type=template_data_type
    )

# CRUD Endpoints

@router.get("/attributes", response_model=List[AttributeResponse])
def get_all_attributes(db: Session = Depends(get_db)):
    attributes = db.query(Attribute).options(joinedload(Attribute.client), joinedload(Attribute.template)).all()
    return [enrich_attribute_response(attr) for attr in attributes]

@router.get("/attributes/{attribute_id}", response_model=AttributeResponse)
def get_attribute_by_id(attribute_id: int, db: Session = Depends(get_db)):
    attribute = db.query(Attribute).options(joinedload(Attribute.client), joinedload(Attribute.template)).filter(Attribute.id == attribute_id).first()
    if not attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")
    return enrich_attribute_response(attribute)

@router.get("/attributes/client/{client_id}", response_model=List[AttributeResponse])
def get_client_attributes(client_id: int, db: Session = Depends(get_db)):
    attributes = db.query(Attribute).options(joinedload(Attribute.client), joinedload(Attribute.template)).filter(Attribute.client_id == client_id).all()
    return [enrich_attribute_response(attr) for attr in attributes]

@router.post("/attributes", response_model=AttributeResponse, status_code=201)
def create_attribute(attribute_data: AttributeCreate, db: Session = Depends(get_db)):
    # Validate client_id and template_id
    client = db.query(Client).filter(Client.id == attribute_data.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found for the given client_id")
    template = db.query(Template).filter(Template.id == attribute_data.template_id).first()
    if not template:
        raise HTTPException(status_code=400, detail="Template not found for the given template_id")

    # Check if attribute for this client and template already exists
    existing_attribute = db.query(Attribute).filter(
        Attribute.client_id == attribute_data.client_id,
        Attribute.template_id == attribute_data.template_id
    ).first()

    if existing_attribute:
        raise HTTPException(status_code=400, detail="Attribute for this client and template already exists. Use PUT to update.")

    db_attribute = Attribute(**attribute_data.model_dump())
    db.add(db_attribute)
    db.commit()
    db.refresh(db_attribute) # Refresh to load relationships
    return enrich_attribute_response(db_attribute)

@router.put("/attributes/{attribute_id}", response_model=AttributeResponse)
def update_attribute(attribute_id: int, attribute_data: AttributeUpdate, db: Session = Depends(get_db)):
    db_attribute = db.query(Attribute).options(joinedload(Attribute.client), joinedload(Attribute.template)).filter(Attribute.id == attribute_id).first()
    if not db_attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")

    # The UI only allows updating the value
    db_attribute.value = attribute_data.value

    db.commit()
    db.refresh(db_attribute)
    return enrich_attribute_response(db_attribute)

@router.delete("/attributes/{attribute_id}", status_code=204)
def delete_attribute(attribute_id: int, db: Session = Depends(get_db)):
    db_attribute = db.query(Attribute).options(joinedload(Attribute.client), joinedload(Attribute.template)).filter(Attribute.id == attribute_id).first()
    if not db_attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")

    db.delete(db_attribute)
    db.commit()
