from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.photo_session import PhotoSession, PhotoSessionCreateSchema, PhotoSessionUpdateSchema
from services.base import BaseService

class SessionService(BaseService):
    def list_sessions(self) -> list[PhotoSession]:
        """Returns a list of all photo sessions with their photographer eagerly loaded."""
        return self.db.query(PhotoSession).options(joinedload(PhotoSession.photographer), joinedload(PhotoSession.album)).all()

    def get_session(self, session_id: int) -> PhotoSession:
        """Returns a specific photo session by its ID with its photographer eagerly loaded."""
        session = (
            self.db.query(PhotoSession)
            .options(joinedload(PhotoSession.photographer), joinedload(PhotoSession.album))
            .filter(PhotoSession.id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo session not found")
        return session

    def create_session(self, session_in: PhotoSessionCreateSchema) -> PhotoSession:
        """Creates a new photo session."""
        db_session = PhotoSession(**session_in.model_dump())
        return self._save_and_refresh(db_session)

    def update_session(self, session_id: int, session_in: PhotoSessionUpdateSchema) -> PhotoSession:
        """Updates an existing photo session."""
        db_session = self.get_session(session_id)
        
        update_data = session_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_session, field, value)
            
        return self._save_and_refresh(db_session)

    def delete_session(self, session_id: int):
        """Deletes a photo session."""
        db_session = self.get_session(session_id)
        return self._delete_and_refresh(db_session)

    # Method for sending cart link is kept for later implementation
    def send_cart_link(self, session_id: int):
        # Business logic for sending a cart link for a session
        return {"message": f"SessionService: Send cart link for session {session_id} logic"}
