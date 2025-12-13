from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from models.tag import Tag, TagCreateSchema, TagUpdateSchema

class TagService:
    def __init__(self, db: Session):
        self.db = db

    def list_tags(self) -> List[Tag]:
        return self.db.query(Tag).all()

    def get_tag(self, tag_id: int) -> Tag:
        tag = self.db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
        return tag

    def create_tag(self, tag_in: TagCreateSchema) -> Tag:
        # Check if tag with the same name already exists (case-insensitive)
        existing_tag = self.db.query(Tag).filter(Tag.name.ilike(tag_in.name)).first()
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag with name '{tag_in.name}' already exists."
            )
        
        db_tag = Tag(name=tag_in.name)
        self.db.add(db_tag)
        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag

    def update_tag(self, tag_id: int, tag_in: TagUpdateSchema) -> Tag:
        tag = self.get_tag(tag_id)
        
        # Check if new name is already taken by another tag
        if tag_in.name and tag.name != tag_in.name:
            existing_tag = self.db.query(Tag).filter(Tag.name.ilike(tag_in.name)).first()
            if existing_tag:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tag with name '{tag_in.name}' already exists."
                )
            tag.name = tag_in.name

        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete_tag(self, tag_id: int) -> None:
        tag = self.get_tag(tag_id)
        self.db.delete(tag)
        self.db.commit()
        return
