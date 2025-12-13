from pydantic import BaseModel
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base
from .cart import CartSchema

# Pydantic models (Schemas)
class SavedCartBaseSchema(BaseModel):
    pass

class SavedCartCreateSchema(SavedCartBaseSchema):
    cart_id: int

class SavedCartSchema(SavedCartBaseSchema):
    id: int
    cart: CartSchema

    class Config:
        from_attributes = True

# SQLAlchemy model
class SavedCart(Base):
    __tablename__ = "saved_carts"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))

    cart = relationship("Cart", back_populates="saved_cart")