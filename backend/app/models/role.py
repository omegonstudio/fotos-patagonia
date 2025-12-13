from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base
from .permission import PermissionSchema

# Association Table for Role and Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)

# Pydantic models (Schemas)
class RoleBaseSchema(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreateSchema(RoleBaseSchema):
    pass

class RoleUpdateSchema(RoleBaseSchema):
    pass

class RoleInDBBaseSchema(RoleBaseSchema):
    id: int

    class Config:
        from_attributes = True

class RoleSchema(RoleInDBBaseSchema):
    permissions: List[PermissionSchema] = []

# SQLAlchemy model
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255))

    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        backref="roles",
        lazy="joined"
    )