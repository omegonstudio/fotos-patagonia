from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from deps import get_db, PermissionChecker
from services.combos import ComboService
from models.combo import ComboSchema, ComboCreateSchema, ComboUpdateSchema
from core.permissions import Permissions
from models.user import User

router = APIRouter(
    prefix="/combos",
    tags=["combos"],
)

@router.get("/", response_model=List[ComboSchema])
def list_combos(db: Session = Depends(get_db)):
    """
    List all available combos.
    """
    return ComboService(db).list_combos()

@router.get("/{combo_id}", response_model=ComboSchema)
def get_combo(combo_id: int, db: Session = Depends(get_db)):
    """
    Get a single combo by its ID.
    """
    return ComboService(db).get_combo(combo_id=combo_id)

@router.post("/", response_model=ComboSchema, status_code=status.HTTP_201_CREATED)
def create_combo(
    combo_in: ComboCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_COMBOS]))
):
    """
    Create a new combo. Requires MANAGE_COMBOS permission.
    """
    return ComboService(db).create_combo(combo_in=combo_in)

@router.put("/{combo_id}", response_model=ComboSchema)
def update_combo(
    combo_id: int,
    combo_in: ComboUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_COMBOS]))
):
    """
    Update a combo. Requires MANAGE_COMBOS permission.
    """
    return ComboService(db).update_combo(combo_id=combo_id, combo_in=combo_in)

@router.delete("/{combo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_combo(
    combo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_COMBOS]))
):
    """
    Delete a combo. Requires MANAGE_COMBOS permission.
    """
    ComboService(db).delete_combo(combo_id=combo_id)
    return
