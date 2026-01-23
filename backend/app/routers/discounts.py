from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from deps import get_db, PermissionChecker
from services.discounts import DiscountService
from models.discount import DiscountSchema, DiscountCreateSchema, DiscountUpdateSchema
from core.permissions import Permissions
from models.user import User


router = APIRouter(
    prefix="/discounts",
    tags=["discounts"],
)
# --- Public validation endpoint (Cart) ---

@router.get("/validate")
def validate_discount(
    code: str = Query(..., min_length=1, description="Discount code (case-insensitive)"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint for validating a discount code (used by the cart).
    Returns minimal data needed to apply the discount.
    """
    normalized = code.strip().upper()
    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido")

    discount = DiscountService(db).find_by_code(normalized)
    if not discount:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Código de descuento inválido")

    if not discount.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El código de descuento no está activo")

    if discount.expires_at is not None:
        # Make datetime timezone-aware for safe comparison
        expires_at = discount.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if expires_at <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El código de descuento está vencido")

    return {
        "id": discount.id,
        "code": discount.code,
        "percentage": discount.percentage,
        "expires_at": discount.expires_at,
        "is_active": discount.is_active,
    }
# --- CRUD Endpoints for Discounts ---

@router.get("/", response_model=List[DiscountSchema])
def list_discounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_DISCOUNTS]))
):
    return DiscountService(db).list_discounts()

@router.post("/", response_model=DiscountSchema, status_code=status.HTTP_201_CREATED)
def create_discount(
    discount_in: DiscountCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_DISCOUNTS]))
):
    return DiscountService(db).create_discount(discount_in=discount_in)

@router.get("/{discount_id}", response_model=DiscountSchema)
def get_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_DISCOUNTS]))
):
    return DiscountService(db).get_discount(discount_id=discount_id)

@router.put("/{discount_id}", response_model=DiscountSchema)
def update_discount(
    discount_id: int,
    discount_in: DiscountUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_DISCOUNTS]))
):
    return DiscountService(db).update_discount(discount_id=discount_id, discount_in=discount_in)

@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.MANAGE_DISCOUNTS]))
):
    return DiscountService(db).delete_discount(discount_id=discount_id)

# --- Cart-related endpoints --- 
# These endpoints might be better suited in the 'cart' or 'checkout' router.

@router.post("/apply-to-cart") # Example of a more specific path
def apply_discount(db: Session = Depends(get_db)):
    # This logic will be more complex, likely involving a cart_id and discount_code
    return {"message": "Apply discount logic to be implemented"}

@router.delete("/remove-from-cart") # Example of a more specific path
def remove_discount(db: Session = Depends(get_db)):
    # This logic will be more complex
    return {"message": "Remove discount logic to be implemented"}