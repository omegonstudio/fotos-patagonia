from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List

from .base import BaseService
from models.album import Album, AlbumCreateSchema, AlbumUpdateSchema
from models.tag import Tag
from models.user import User
from core.permissions import Permissions

class AlbumService(BaseService):
    def list_albums(self) -> list[Album]:
        """Returns a list of all albums with their sessions eagerly loaded."""
        return self.db.query(Album).options(joinedload(Album.sessions)).all()

    def get_album(self, album_id: int) -> Album:
        """Returns a specific album by its ID with its session eagerly loaded."""
        album = (
            self.db.query(Album)
            .options(joinedload(Album.sessions))
            .filter(Album.id == album_id)
            .first()
        )
        if not album:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
        return album

    def create_album(self, album_in: AlbumCreateSchema) -> Album:
        """Creates a new album and saves it to the database."""
        album_data = album_in.model_dump()
        
        db_album = Album(**album_data)
        return self._save_and_refresh(db_album)

    def update_album(self, album_id: int, album_in: AlbumUpdateSchema) -> Album:
        """Updates an existing album, checking for admin privileges."""
        db_album = self.get_album(album_id)

        update_data = album_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_album, field, value)
            
        return self._save_and_refresh(db_album)

    def delete_album(self, album_id: int):
        """Deletes an album, checking for admin privileges."""
        db_album = self.get_album(album_id)

        self.db.delete(db_album)
        self.db.commit()
        return None

    def set_tags_for_album(self, album_id: int, tag_names: List[str], current_user: User) -> Album:
        """
        Sets the tags for an album, checking for elevated permissions.
        Creates tags that don't exist and removes old tag associations.
        """
        db_album = self.get_album(album_id)
        user_permissions = {p.name for p in current_user.role.permissions}

        can_edit_any = Permissions.EDIT_ANY_ALBUM.value in user_permissions

        if not can_edit_any:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit tags for this album.")

        # Clear existing tags
        db_album.tags.clear()
        
        for tag_name in tag_names:
            if not tag_name.strip():
                continue

            # Find existing tag or create a new one
            tag = self.db.query(Tag).filter(Tag.name.ilike(tag_name.strip())).first()
            if not tag:
                tag = Tag(name=tag_name.strip())
                self.db.add(tag)

            db_album.tags.append(tag)
            
        return self._save_and_refresh(db_album)