from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base
from .user import UserSchema
from .photo import PhotoSchema
from .photo_session import PhotoSessionSchema

# Pydantic models (Schemas)
class CartItemBaseSchema(BaseModel):
    quantity: int = 1

class CartItemCreateSchema(CartItemBaseSchema):
    photo_id: int

class CartItemSchema(CartItemBaseSchema):
    id: int
    photo: PhotoSchema

    class Config:
        from_attributes = True

class CartItemUpdateSchema(BaseModel):
    photo_id: int
    quantity: int

class CartUpdateSchema(BaseModel):
    items: List[CartItemUpdateSchema] = []
    user_email: Optional[str] = None
    discount_code: Optional[str] = None

class CartBaseSchema(BaseModel):
    pass

class CartCreateSchema(CartBaseSchema):
    user_id: Optional[int] = None
    guest_id: Optional[str] = None
    photo_session_id: Optional[int] = None

class CartSchema(CartBaseSchema):
    id: int
    user: Optional[UserSchema] = None
    guest_id: Optional[str] = None
    items: List[CartItemSchema] = []
    photo_session: Optional[PhotoSessionSchema] = None
    total: float

    class Config:
        from_attributes = True

# SQLAlchemy models
class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    guest_id = Column(String, nullable=True, unique=True, index=True)
    user_email = Column(String, nullable=True)
    discount_code = Column(String, nullable=True)
    photo_session_id = Column(Integer, ForeignKey("photo_sessions.id"), nullable=True)

    user = relationship("User", back_populates="carts")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    saved_cart = relationship("SavedCart", back_populates="cart", uselist=False)
    photo_session = relationship("PhotoSession")

    @property
    def total(self) -> float:
        return sum(item.quantity * item.photo.price for item in self.items if item.photo)

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    photo_id = Column(Integer, ForeignKey("photos.id"))
    quantity = Column(Integer, default=1)

    cart = relationship("Cart", back_populates="items")
    photo = relationship("Photo", back_populates="cart_items")