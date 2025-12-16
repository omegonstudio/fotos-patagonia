from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.photo import Photo, PhotoCreateSchema, PhotoUpdateSchema, PhotoSchema
from models.tag import Tag
from services.base import BaseService
from services.storage import storage_service
from pydantic import BaseModel
from typing import List
from models.user import User
from core.permissions import Permissions
from datetime import datetime # Added
from services.sessions import SessionService # Added
from models.photo_session import PhotoSessionCreateSchema as SessionCreateSchema # Added alias

class PhotoCompletionRequest(BaseModel):
    object_name: str
    original_filename: str
    description: str | None = None
    price: float
    photographer_id: int

class PhotoService(BaseService):
    def list_photos(self):
        """Returns a list of all photos with their photographer and album eagerly loaded."""
        return self.db.query(Photo).options(joinedload(Photo.photographer), joinedload(Photo.session)).all()

    def get_photo(self, photo_id: int):
        """Returns a specific photo by its ID with its photographer and album eagerly loaded."""
        photo = (
            self.db.query(Photo)
            .options(joinedload(Photo.photographer), joinedload(Photo.session))
            .filter(Photo.id == photo_id)
            .first()
        )
        if not photo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
        return photo

    def create_photo(self, photo_in: PhotoCreateSchema) -> Photo:
        """Creates a new photo record in the database."""
        db_photo = Photo(**photo_in.model_dump())
        return self._save_and_refresh(db_photo)

    def update_photo(self, photo_id: int, photo_in: PhotoUpdateSchema, current_user: User) -> Photo:
        """Updates an existing photo record, checking for ownership."""
        db_photo = self.get_photo(photo_id)
        user_permissions = {p.name for p in current_user.role.permissions}

        can_edit_any = Permissions.EDIT_ANY_PHOTO.value in user_permissions
        can_edit_own = Permissions.EDIT_OWN_PHOTO.value in user_permissions

        if not can_edit_any:
            if not can_edit_own or not current_user.photographer or db_photo.photographer_id != current_user.photographer.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this photo.")

        update_data = photo_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_photo, field, value)
            
        return self._save_and_refresh(db_photo)

    def delete_photo(self, photo_id: int, current_user: User):
        """
        Deletes a photo record and its corresponding file from storage.
        Permission checks are handled here to allow admins to delete any photo.
        """
        db_photo = self.get_photo(photo_id)
        user_permissions = {p.name for p in current_user.role.permissions}

        # First, check for the master 'full_access' permission
        if Permissions.FULL_ACCESS.value in user_permissions:
            pass # Admin with full access can do anything
        else:
            # Otherwise, check for specific delete permissions
            can_delete_any = Permissions.DELETE_ANY_PHOTO.value in user_permissions
            can_delete_own = Permissions.DELETE_OWN_PHOTO.value in user_permissions
            is_owner = current_user.photographer and db_photo.photographer_id == current_user.photographer.id

            if not can_delete_any and not (can_delete_own and is_owner):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this photo."
                )
        
        # Extract object name from URL to delete from storage
        try:
            # Basic parsing, might need to be more robust depending on URL structure
            object_name = db_photo.url.split(storage_service.bucket_name + '/')[-1].split('?')[0]
            if object_name:
                 storage_service.delete_file(object_name)
        except Exception as e:
            # Log the error but proceed to delete the DB record
            print(f"Error deleting file from storage: {e}")
            
        return self._delete_and_refresh(db_photo)

    def bulk_delete_photos(self, photo_ids: List[int], current_user: User):
        """
        Deletes multiple photos by their IDs, performing permission checks for each.
        """
        if not photo_ids:
            return {"deleted_count": 0, "errors": []}

        user_permissions = {p.name for p in current_user.role.permissions}
        has_full_access = Permissions.FULL_ACCESS.value in user_permissions
        can_delete_any = Permissions.DELETE_ANY_PHOTO.value in user_permissions
        can_delete_own = Permissions.DELETE_OWN_PHOTO.value in user_permissions

        # Fetch all photos to be deleted in a single query
        photos_to_delete = self.db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
        
        valid_photos_to_delete = []
        errors = []
        
        photo_map = {photo.id: photo for photo in photos_to_delete}

        for photo_id in photo_ids:
            photo = photo_map.get(photo_id)
            if not photo:
                errors.append(f"Photo with ID {photo_id} not found.")
                continue

            if has_full_access or can_delete_any:
                valid_photos_to_delete.append(photo)
            else:
                is_owner = current_user.photographer and photo.photographer_id == current_user.photographer.id
                if can_delete_own and is_owner:
                    valid_photos_to_delete.append(photo)
                else:
                    errors.append(f"Permission denied to delete photo with ID {photo_id}.")

        if not valid_photos_to_delete:
            if errors:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="; ".join(errors))
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid photos found to delete.")

        # Delete from storage and collect DB IDs for bulk delete
        db_ids_to_delete = []
        for photo in valid_photos_to_delete:
            try:
                object_name = photo.url.split(storage_service.bucket_name + '/')[-1].split('?')[0]
                if object_name:
                    storage_service.delete_file(object_name)
            except Exception as e:
                print(f"Error deleting file for photo ID {photo.id} from storage: {e}")
            db_ids_to_delete.append(photo.id)
            
        # Bulk delete from DB
        self.db.query(Photo).filter(Photo.id.in_(db_ids_to_delete)).delete(synchronize_session=False)
        self.db.commit()

        return {"deleted_count": len(db_ids_to_delete), "errors": errors}

    def set_tags_for_photo(self, photo_id: int, tag_names: List[str], current_user: User) -> Photo:
        """
        Sets the tags for a photo, checking for ownership or elevated permissions.
        """
        db_photo = self.get_photo(photo_id)
        user_permissions = {p.name for p in current_user.role.permissions}
        can_edit_any = Permissions.EDIT_ANY_PHOTO.value in user_permissions
        can_edit_own = Permissions.EDIT_OWN_PHOTO.value in user_permissions

        if not can_edit_any:
            if not can_edit_own or not current_user.photographer or db_photo.photographer_id != current_user.photographer.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit tags for this photo.")

        # Clear existing tags
        db_photo.tags.clear()
        
        for tag_name in tag_names:
            if not tag_name.strip():
                continue

            # Find existing tag or create a new one
            tag = self.db.query(Tag).filter(Tag.name.ilike(tag_name.strip())).first()
            if not tag:
                tag = Tag(name=tag_name.strip())
                self.db.add(tag)
            
            db_photo.tags.append(tag)
            
        return self._save_and_refresh(db_photo)

    def finalize_photo_uploads(self, completion_requests: List[PhotoCompletionRequest], current_user: User, album_id: int | None = None) -> List[PhotoSchema]:
        """
        Finalizes the upload process by creating photo records in the database
        after files have been uploaded to the storage service.
        A new PhotoSession is created for each batch of uploads.
        """
        created_photos = []
        user_permissions = {p.name for p in current_user.role.permissions}
        can_edit_any = Permissions.EDIT_ANY_PHOTO.value in user_permissions or Permissions.FULL_ACCESS.value in user_permissions

        if not completion_requests:
            return []

        # Assuming all photos in a batch belong to the same photographer
        photographer_id = completion_requests[0].photographer_id

        # Create a new PhotoSession for this batch
        try:
            session_service = SessionService(self.db)
            new_session_data = SessionCreateSchema(
                event_name=f"Carga de fotos {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                description="Sesión generada automáticamente para un lote de carga de fotos.",
                event_date=datetime.now(),
                location="Carga en línea",
                photographer_id=photographer_id,
                album_id=album_id # Assign the album ID passed from the router
            )
            new_session = session_service.create_session(session_in=new_session_data)
            batch_session_id = new_session.id
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create photo session for batch: {str(e)}"
            )

        for photo_data in completion_requests:
            # Authorization check: User must be the photographer or have admin-like permissions
            if not can_edit_any:
                if not current_user.photographer or photo_data.photographer_id != current_user.photographer.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"You do not have permission to upload photos for photographer ID {photo_data.photographer_id}."
                    )
            try:
                get_url = storage_service.generate_presigned_get_url(photo_data.object_name)
                watermark_url = get_url # Placeholder for now

                photo_in = PhotoCreateSchema(
                    filename=photo_data.original_filename,
                    description=photo_data.description,
                    price=photo_data.price,
                    url=get_url,
                    watermark_url=watermark_url,
                    photographer_id=photo_data.photographer_id,
                    session_id=batch_session_id, # Assign the newly created session ID
                )
                
                created_photo = self.create_photo(photo_in=photo_in)
                created_photos.append(PhotoSchema.model_validate(created_photo))

            except HTTPException as e:
                raise e
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create photo record for {photo_data.original_filename}: {str(e)}"
                )
        return created_photos

    # Methods for file upload logic will be kept as is
    def download_photo(self, photo_id: int):
        # Business logic for downloading a photo
        return {"message": f"PhotoService: Download photo {photo_id} logic"}

    def request_presigned_urls(self):
        # Business logic for requesting presigned URLs
        return {"message": "PhotoService: Request presigned URLs logic"}
