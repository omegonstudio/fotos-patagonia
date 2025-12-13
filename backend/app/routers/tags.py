from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from deps import get_db, PermissionChecker
from services.tags import TagService
from models.tag import TagSchema, TagCreateSchema, TagUpdateSchema
from models.tag import Tag as TagModel
from core.permissions import Permissions
from models.user import User

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
)

@router.get("/", response_model=List[TagSchema])
def list_tags(db: Session = Depends(get_db)):
    """
    List all available tags.
    """
    return TagService(db).list_tags()

@router.get("/{tag_id}", response_model=TagSchema)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    """
    Get a single tag by its ID.
    """
    return TagService(db).get_tag(tag_id=tag_id)

@router.post("/", response_model=TagSchema, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_in: TagCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_TAGS]))
):
    """
    Create a new tag. Requires MANAGE_TAGS permission.
    """
    return TagService(db).create_tag(tag_in=tag_in)

@router.put("/{tag_id}", response_model=TagSchema)
def update_tag(
    tag_id: int,
    tag_in: TagUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_TAGS]))
):
    """
    Update a tag's name. Requires MANAGE_TAGS permission.
    """
    return TagService(db).update_tag(tag_id=tag_id, tag_in=tag_in)

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_TAGS]))
):
    """
    Delete a tag. Requires MANAGE_TAGS permission.
    """
    TagService(db).delete_tag(tag_id=tag_id)
    return
