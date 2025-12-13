from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from db.base import Base
from typing import Optional

# Pydantic models (Schemas)
class PermissionBaseSchema(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionCreateSchema(PermissionBaseSchema):
    pass

class PermissionSchema(PermissionBaseSchema):
    id: int

    class Config:
        from_attributes = True

# SQLAlchemy model
class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255))
