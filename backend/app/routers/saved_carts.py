from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from deps import get_db, PermissionChecker, get_current_user_or_guest
from services.saved_carts import SavedCartService
from models.saved_cart import SavedCartSchema, SavedCartCreateSchema
from core.permissions import Permissions
from models.user import User

router = APIRouter(
    prefix="/saved-carts",
    tags=["saved-carts"],
)

@router.get("/", response_model=List[SavedCartSchema])
def list_saved_carts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.LIST_ALL_ORDERS]))
):
    return SavedCartService(db).list_saved_carts()

@router.post("/", response_model=SavedCartSchema, status_code=status.HTTP_201_CREATED)
def create_saved_cart(
    saved_cart_in: SavedCartCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest) # Permitir invitados
):
    return SavedCartService(db).create_saved_cart(saved_cart_in=saved_cart_in)

@router.get("/by-short-id/{short_id}", response_model=SavedCartSchema)
def get_saved_cart_by_short_id(
    short_id: str,
    db: Session = Depends(get_db)
):
    return SavedCartService(db).get_saved_cart_by_short_id(short_id=short_id)

@router.get("/{saved_cart_id}", response_model=SavedCartSchema)
def get_saved_cart(
    saved_cart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.LIST_ALL_ORDERS]))
):
    return SavedCartService(db).get_saved_cart(saved_cart_id=saved_cart_id)

@router.delete("/{saved_cart_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_cart(
    saved_cart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.LIST_ALL_ORDERS]))
):
    return SavedCartService(db).delete_saved_cart(saved_cart_id=saved_cart_id)

# --- Special Actions ---

@router.post("/{cart_id}/send-recovery-email")
def send_recovery_email(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.LIST_ALL_ORDERS]))
):
    return SavedCartService(db).send_recovery_email(cart_id)