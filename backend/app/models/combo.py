from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, Float, Boolean
from db.base import Base
from typing import Optional

# --- Pydantic Schemas ---
class ComboBaseSchema(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    totalPhotos: int
    isFullAlbum: bool
    active: bool = True # Default to active

class ComboCreateSchema(ComboBaseSchema):
    pass

class ComboUpdateSchema(ComboBaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    totalPhotos: Optional[int] = None
    isFullAlbum: Optional[bool] = None
    active: Optional[bool] = None

class ComboSchema(ComboBaseSchema):
    id: int

    class Config:
        from_attributes = True

# --- SQLAlchemy Model ---
class Combo(Base):
    __tablename__ = "combos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    totalPhotos = Column(Integer, nullable=False)
    isFullAlbum = Column(Boolean, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
