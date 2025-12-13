from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from deps import get_db, get_current_user
from services.cart import CartService
from models.user import User
from models.cart import CartItemCreateSchema, CartSchema

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
)

@router.get("/", response_model=CartSchema)
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).get_or_create_cart(user_id=user.id)

@router.post("/items", response_model=CartSchema)
def add_item_to_cart(item: CartItemCreateSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).add_item_to_cart(user_id=user.id, item=item)

@router.put("/items/{item_id}", response_model=CartSchema)
def update_cart_item(item_id: int, quantity: int = Body(..., embed=True), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).update_cart_item(user_id=user.id, item_id=item_id, quantity=quantity)

@router.delete("/items/{item_id}", response_model=CartSchema)
def delete_cart_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).delete_cart_item(user_id=user.id, item_id=item_id)

@router.delete("/", response_model=CartSchema)
def empty_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).empty_cart(user_id=user.id)
