from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base

# Association table for Photos and Tags
photo_tags = Table(
    "photo_tags",
    Base.metadata,
    Column("photo_id", Integer, ForeignKey("photos.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

# Association table for Albums and Tags
album_tags = Table(
    "album_tags",
    Base.metadata,
    Column("album_id", Integer, ForeignKey("albums.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

# --- Pydantic Schemas ---
class TagBaseSchema(BaseModel):
    name: str

class TagCreateSchema(TagBaseSchema):
    pass

class TagUpdateSchema(TagBaseSchema):
    pass

class TagSchema(TagBaseSchema):
    id: int

    class Config:
        from_attributes = True

# --- SQLAlchemy Model ---
class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

    # Many-to-Many relationships
    photos = relationship(
        "Photo",
        secondary=photo_tags,
        back_populates="tags"
    )
    albums = relationship(
        "Album",
        secondary=album_tags,
        back_populates="tags"
    )
