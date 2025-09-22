from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Client, Attribute, Template

router = APIRouter()


class ClientCreate(BaseModel):
    client_code: str
    name: str
    description: Optional[str] = None
    product_api: Optional[str] = None
    product_list: Optional[str] = None
    attributes: Dict[str, str] = Field(default_factory=dict)


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    product_api: Optional[str] = None
    product_list: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None


class StatusUpdate(BaseModel):
    status: str


class ClientResponse(BaseModel):
    id: int
    client_code: str
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    product_api: Optional[str] = None
    product_list: Optional[str] = None

    class Config:
        from_attributes = True

class AttributeResponse(BaseModel):
    template_key: str
    value: str

@router.get("/clients", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db)):
    clients = db.query(Client).all()
    return clients


@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client_by_id(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/clients", response_model=ClientResponse, status_code=201)
def create_client(client_data: ClientCreate, db: Session = Depends(get_db)):
    db_client_code = db.query(Client).filter(Client.client_code == client_data.client_code).first()
    if db_client_code:
        raise HTTPException(status_code=400, detail="Client with this code already exists")

    db_client_name = db.query(Client).filter(Client.name == client_data.name).first()
    if db_client_name:
        raise HTTPException(status_code=400, detail="Client with this name already exists")

    db_client = Client(
        client_code=client_data.client_code,
        name=client_data.name,
        description=client_data.description,
        status='Activo',
        product_api=client_data.product_api,
        product_list=client_data.product_list
    )
    db.add(db_client)

    # Pre-fetch all relevant templates to avoid N+1 queries
    if client_data.attributes:
        template_keys = [key for key, value in client_data.attributes.items() if value]
        if template_keys:
            templates = db.query(Template).filter(Template.key.in_(template_keys)).all()
            templates_map = {template.key: template for template in templates}

            # Eager-load the client ID before creating attributes
            db.flush()

            for template_key, value in client_data.attributes.items():
                template = templates_map.get(template_key)
                if value and template:
                    attribute = Attribute(client_id=db_client.id, template_id=template.id, value=value)
                    db.add(attribute)

    db.commit()  # Single commit for client and all attributes
    db.refresh(db_client)

    return db_client


@router.put("/clients/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, client_data: ClientUpdate, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        existing_name = db.query(Client).filter(Client.name == update_data["name"], Client.id != client_id).first()
        if existing_name:
            raise HTTPException(status_code=400, detail="Client with this name already exists")

    for key, value in update_data.items():
        if key != "attributes":
            setattr(db_client, key, value)

    if client_data.attributes is not None:
        # 1. Fetch all relevant templates at once
        template_keys = client_data.attributes.keys()
        templates = db.query(Template).filter(Template.key.in_(template_keys)).all()
        templates_map = {template.key: template for template in templates}

        # 2. Fetch all existing attributes for this client at once
        template_ids = [t.id for t in templates]
        existing_attributes = db.query(Attribute).filter(
            Attribute.client_id == client_id,
            Attribute.template_id.in_(template_ids)
        ).all()
        existing_attributes_map = {attr.template_id: attr for attr in existing_attributes}

        # 3. Process updates
        for template_key, new_value in client_data.attributes.items():
            template = templates_map.get(template_key)
            if not template:
                continue

            existing_attr = existing_attributes_map.get(template.id)

            if existing_attr:
                if new_value:
                    existing_attr.value = new_value
                else:
                    db.delete(existing_attr)
            elif new_value:
                new_attribute = Attribute(client_id=client_id, template_id=template.id, value=new_value)
                db.add(new_attribute)

    db.commit()  # Single commit for all changes
    db.refresh(db_client)
    return db_client


@router.put("/clients/{client_code}/status", response_model=ClientResponse)
def update_client_status(client_code: str, status_update: StatusUpdate, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.client_code == client_code).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    db_client.status = status_update.status
    db.commit()
    db.refresh(db_client)
    return db_client


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(db_client)
    db.commit()
    return {"ok": True}


@router.get("/clients/{client_id}/attributes", response_model=List[AttributeResponse])
def get_client_attributes(client_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all attributes for a specific client.
    """
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    attributes_with_templates = db.query(
        Attribute.value,
        Template.key.label("template_key")
    ).join(Template, Attribute.template_id == Template.id).filter(
        Attribute.client_id == client_id
    ).all()

    return attributes_with_templates