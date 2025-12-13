from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from typing import List, Optional
from db.base import Base
from .photographer import PhotographerSchema
from .tag import TagSchema

# Pydantic models (Schemas)
class PhotoBaseSchema(BaseModel):
    filename: str
    description: Optional[str] = None
    price: float
    url: str
    watermark_url: str

class PhotoCreateSchema(PhotoBaseSchema):
    photographer_id: int
    session_id: int

class PhotoUpdateSchema(PhotoBaseSchema):
    pass

class PhotoInDBBaseSchema(PhotoBaseSchema):
    id: int
    photographer: PhotographerSchema
    session_id: int
    tags: List[TagSchema] = []

    class Config:
        from_attributes = True

class PhotoSchema(PhotoInDBBaseSchema):
    pass

# SQLAlchemy model
class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    description = Column(String(255))
    price = Column(Float, nullable=False)
    url = Column(Text, nullable=False)
    watermark_url = Column(Text, nullable=False)
    photographer_id = Column(Integer, ForeignKey("photographers.id"))
    session_id = Column(Integer, ForeignKey("photo_sessions.id"))

    photographer = relationship("Photographer", back_populates="photos")
    session = relationship("PhotoSession", back_populates="photos")
    cart_items = relationship("CartItem", back_populates="photo")
    order_items = relationship("OrderItem", back_populates="photo")
    tags = relationship("Tag", secondary="photo_tags", back_populates="photos")

from .photo_session import PhotoSessionSchema
PhotoSchema.model_rebuild()