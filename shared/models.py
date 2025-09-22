from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func  # Import func
from datetime import datetime

Base = declarative_base()


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    data_type = Column(String, nullable=False, default='text')
    status = Column(String, nullable=False, default='Activo')

    attributes = relationship("Attribute", back_populates="template")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, nullable=False, default='Activo')
    created_at = Column(DateTime, server_default=func.now()) # Use server default

    users = relationship("User", back_populates="client")
    attributes = relationship("Attribute", back_populates="client")


class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="attributes")
    template = relationship("Template", back_populates="attributes")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    session_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default='Activo')
    created_at = Column(DateTime, server_default=func.now()) # Use server default

    client = relationship("Client", back_populates="users")


class Communication(Base):
    __tablename__ = "communication"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False)
    message = Column(JSONB, nullable=False)
    # Set server-side default and make it non-nullable
    created_at = Column(DateTime, nullable=False, server_default=func.now())
