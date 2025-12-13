from fastapi import APIRouter, Depends, status
from typing import List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from deps import get_db, PermissionChecker
from services.albums import AlbumService
from models.album import AlbumCreateSchema, AlbumUpdateSchema, AlbumSchema
from models.user import User
from core.permissions import Permissions

router = APIRouter(prefix="/albums", tags=["albums"],)

class TagRequest(BaseModel):
    tag_names: List[str]

@router.get("/", response_model=List[AlbumSchema])
def list_albums(db: Session = Depends(get_db)):
    return AlbumService(db).list_albums()

@router.post("/", response_model=AlbumSchema, status_code=status.HTTP_201_CREATED)
def create_album(
    album_in: AlbumCreateSchema,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker([Permissions.CREATE_ALBUM]))
):
    new_album = AlbumService(db).create_album(album_in)
    return new_album

@router.get("/{album_id}", response_model=AlbumSchema)
def get_album(album_id: int, db: Session = Depends(get_db)):
    album = AlbumService(db).get_album(album_id)
    return album

@router.put("/{album_id}", response_model=AlbumSchema)
def update_album(
    album_id: int,
    album_update: AlbumUpdateSchema,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker(
        [Permissions.EDIT_OWN_ALBUM, Permissions.EDIT_ANY_ALBUM], require_all=False
    ))
):
    return AlbumService(db).update_album(album_id, album_update)

@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(
    album_id: int,
    db: Session = Depends(get_db),
    _ = Depends(PermissionChecker(
        [Permissions.DELETE_OWN_ALBUM, Permissions.DELETE_ANY_ALBUM], require_all=False
    ))
):
    AlbumService(db).delete_album(album_id)
    return None


@router.post("/{album_id}/tags", response_model=AlbumSchema)
def set_album_tags(
    album_id: int,
    request: TagRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.EDIT_ANY_ALBUM]))
):
    """
    Set the tags for an album. This will replace all existing tags.
    """
    return AlbumService(db).set_tags_for_album(
        album_id=album_id, tag_names=request.tag_names, current_user=current_user
    )
