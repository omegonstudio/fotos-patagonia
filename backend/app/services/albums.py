from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List

from .base import BaseService
from models.album import Album, AlbumCreateSchema, AlbumUpdateSchema
from models.tag import Tag
from models.user import User
from core.permissions import Permissions
from models.photo_session import PhotoSession
from models.tag import Tag
from models.photo import Photo, PhotoSchema
from services.photos import PhotoService # Import PhotoService
from services.storage import storage_service # Import storage_service for direct use

class AlbumService(BaseService):
    def _populate_photo_urls(self, album: Album) -> Album:
        """
        Populates presigned URLs for all photos within an album's sessions.
        """
        # This function is now a placeholder. The frontend will request URLs based on object_name.
        return album

    def list_albums(self) -> list[Album]:
        """Returns a list of all albums with populated photo URLs."""
        albums = self.db.query(Album).options(
            joinedload(Album.sessions).joinedload(PhotoSession.photos)
        ).all()
        
        return [self._populate_photo_urls(album) for album in albums]

    def get_album(self, album_id: int) -> Album:
        """Returns a specific album by its ID with populated photo URLs."""
        album = (
            self.db.query(Album)
            .options(
                joinedload(Album.sessions).joinedload(PhotoSession.photos)
            )
            .filter(Album.id == album_id)
            .first()
        )
        if not album:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

        return self._populate_photo_urls(album)

    def create_album(self, album_in: AlbumCreateSchema) -> Album:
     data = album_in.model_dump(exclude={"session_ids", "tag_ids"})
     db_album = Album(**data)
     if album_in.session_ids:
        sessions = self.db.query(PhotoSession).filter(PhotoSession.id.in_(album_in.session_ids)).all()
        db_album.sessions = sessions
     if album_in.tag_ids:
        tags = self.db.query(Tag).filter(Tag.id.in_(album_in.tag_ids)).all()
        db_album.tags = tags
     return self._save_and_refresh(db_album)

    def update_album(self, album_id: int, album_in: AlbumUpdateSchema) -> Album:
     db_album = self.get_album(album_id) # get_album now populates URLs, which is fine
     data = album_in.model_dump(exclude_unset=True)

     for field in ["name", "description", "cover_photo_id", "default_photo_price"]:
        if field in data:
            setattr(db_album, field, data[field])

     if "session_ids" in data:
        sessions = self.db.query(PhotoSession).filter(PhotoSession.id.in_(data["session_ids"])).all()
        db_album.sessions = sessions

     if "tag_ids" in data:
        tags = self.db.query(Tag).filter(Tag.id.in_(data["tag_ids"])).all()
        db_album.tags = tags

     updated_album = self._save_and_refresh(db_album)
     return self._populate_photo_urls(updated_album)

    def delete_album(self, album_id: int):
        db_album = self.get_album(album_id)
        self.db.delete(db_album)
        self.db.commit()
        return None

    def set_tags_for_album(self, album_id: int, tag_names: List[str], current_user: User) -> Album:
        db_album = self.get_album(album_id)
        user_permissions = {p.name for p in current_user.role.permissions}

        can_edit_any = Permissions.EDIT_ANY_ALBUM.value in user_permissions

        if not can_edit_any:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit tags for this album.")

        db_album.tags.clear()
        
        for tag_name in tag_names:
            if not tag_name.strip():
                continue
            tag = self.db.query(Tag).filter(Tag.name.ilike(tag_name.strip())).first()
            if not tag:
                tag = Tag(name=tag_name.strip())
                self.db.add(tag)

            db_album.tags.append(tag)
            
        updated_album = self._save_and_refresh(db_album)
        return self._populate_photo_urls(updated_album)