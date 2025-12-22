from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from typing import List, Optional
from db.base import Base
from models.photographer import PhotographerSchema
from .tag import TagSchema

# Pydantic models (Schemas)
class AlbumBaseSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    session_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None

class AlbumCreateSchema(AlbumBaseSchema):
    pass

class AlbumUpdateSchema(AlbumBaseSchema):
    pass

class AlbumInDBBaseSchema(AlbumBaseSchema):
    id: int

    class Config:
        from_attributes = True

class AlbumInSessionSchema(AlbumInDBBaseSchema):
    pass

class AlbumSchema(AlbumInDBBaseSchema):
    sessions: list['PhotoSessionSchema'] = []
    tags: List[TagSchema] = []

# SQLAlchemy model
class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    description = Column(String(255))

    sessions = relationship("PhotoSession", back_populates="album")
    tags = relationship("Tag", secondary="album_tags", back_populates="albums")

# Import schemas for forward references and rebuild
from .photo_session import PhotoSessionSchema
AlbumSchema.model_rebuild()