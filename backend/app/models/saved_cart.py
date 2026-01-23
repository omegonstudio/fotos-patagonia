from pydantic import BaseModel, Json
from sqlalchemy import Column, Integer, ForeignKey, String, JSON
from sqlalchemy.orm import relationship
from db.base import Base
from typing import Any

# Pydantic models (Schemas)
class SavedCartBaseSchema(BaseModel):
    pass

class SavedCartSessionCreateSchema(BaseModel):
    cart_state: dict[str, Any]

class SavedCartSchema(SavedCartBaseSchema):
    id: int
    public_id: str
    cart_state: dict[str, Any]

    class Config:
        from_attributes = True

# SQLAlchemy model
class SavedCart(Base):
    __tablename__ = "saved_carts"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True, nullable=False)
    cart_state = Column(JSON, nullable=False)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=True)

    cart = relationship("Cart", back_populates="saved_cart")