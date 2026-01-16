from fastapi import APIRouter, Depends, Body, Header, HTTPException, status
from sqlalchemy.orm import Session
from deps import get_db, get_current_user_or_guest, get_current_user
from services.cart import CartService
from models.user import User
from models.cart import CartItemCreateSchema, CartSchema, CartUpdateSchema

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
)

@router.post("/", response_model=CartSchema, status_code=status.HTTP_201_CREATED)
def create_cart(
    cart_in: CartUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")
    
    return CartService(db).create_cart_with_items(cart_in=cart_in, user_id=user_id, guest_id=guest_id)

@router.put("/{cart_id}", response_model=CartSchema)
def update_cart(
    cart_id: int,
    cart_in: CartUpdateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    # Podríamos añadir una verificación para asegurar que el usuario solo actualice su propio carrito
    return CartService(db).update_cart(cart_id=cart_id, cart_in=cart_in)

@router.get("/", response_model=CartSchema)
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None # Si hay user_id, ignoramos guest_id de header

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")

    return CartService(db).get_or_create_cart(user_id=user_id, guest_id=guest_id)

@router.post("/items", response_model=CartSchema)
def add_item_to_cart(
    item: CartItemCreateSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")

    return CartService(db).add_item_to_cart(user_id=user_id, guest_id=guest_id, item=item)

@router.put("/items/{item_id}", response_model=CartSchema)
def update_cart_item(
    item_id: int,
    quantity: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")

    return CartService(db).update_cart_item(user_id=user_id, guest_id=guest_id, item_id=item_id, quantity=quantity)

@router.delete("/items/{item_id}", response_model=CartSchema)
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")

    return CartService(db).delete_cart_item(user_id=user_id, guest_id=guest_id, item_id=item_id)

@router.delete("/", response_model=CartSchema)
def empty_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_or_guest),
    x_guest_id: str | None = Header(None, alias="X-Guest-ID")
):
    user_id = user.id if user.id else None
    guest_id = x_guest_id if not user_id else None

    if user_id is None and guest_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere User ID o Guest ID")

    return CartService(db).empty_cart(user_id=user_id, guest_id=guest_id)

@router.post("/merge", status_code=status.HTTP_204_NO_CONTENT)
def merge_guest_cart(
    guest_id: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # El usuario debe estar autenticado para fusionar un carrito de invitado
    if not user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to merge cart")
    
    CartService(db).transfer_guest_cart_to_user(guest_id=guest_id, user_id=user.id)
    return
