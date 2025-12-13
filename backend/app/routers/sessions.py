from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from deps import get_db, PermissionChecker
from services.sessions import SessionService
from models.photo_session import PhotoSessionSchema, PhotoSessionCreateSchema, PhotoSessionUpdateSchema
from core.permissions import Permissions
from models.user import User

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
)

@router.get("/", response_model=List[PhotoSessionSchema])
def list_sessions(db: Session = Depends(get_db)):
    return SessionService(db).list_sessions()

@router.post("/", response_model=PhotoSessionSchema, status_code=status.HTTP_201_CREATED)
def create_session(
    session_in: PhotoSessionCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.CREATE_ALBUM]))
):
    return SessionService(db).create_session(session_in=session_in)

@router.get("/{session_id}", response_model=PhotoSessionSchema)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return SessionService(db).get_session(session_id=session_id)

@router.put("/{session_id}", response_model=PhotoSessionSchema)
def update_session(
    session_id: int,
    session_in: PhotoSessionUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.EDIT_ANY_ALBUM]))
):
    return SessionService(db).update_session(session_id=session_id, session_in=session_in)

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.DELETE_ANY_SESSION]))
):
    return SessionService(db).delete_session(session_id=session_id)

# --- Special Actions ---

@router.post("/{session_id}/send-cart-link")
def send_cart_link(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.EDIT_ANY_ALBUM]))
):
    return SessionService(db).send_cart_link(session_id)