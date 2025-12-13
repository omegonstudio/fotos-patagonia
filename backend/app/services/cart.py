from sqlalchemy.orm import Session, joinedload, joinedload
from models.cart import Cart, CartItem, CartItemCreateSchema
from fastapi import HTTPException

class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, user_id: int) -> Cart:
        cart = self.db.query(Cart).options(joinedload(Cart.items).joinedload(CartItem.photo)).filter(Cart.user_id == user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
            # After creating, re-fetch with items and photos loaded
            cart = self.db.query(Cart).options(joinedload(Cart.items).joinedload(CartItem.photo)).filter(Cart.id == cart.id).first()
        return cart

    def add_item_to_cart(self, user_id: int, item: CartItemCreateSchema):
        cart = self.get_or_create_cart(user_id)
        cart_item = self.db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.photo_id == item.photo_id).first()

        if cart_item:
            cart_item.quantity += item.quantity
        else:
            cart_item = CartItem(cart_id=cart.id, photo_id=item.photo_id, quantity=item.quantity)
            self.db.add(cart_item)
        
        self.db.commit()
        self.db.refresh(cart)
        # Re-fetch the cart with items and photos loaded to ensure proper serialization
        cart = self.db.query(Cart).options(joinedload(Cart.items).joinedload(CartItem.photo)).filter(Cart.id == cart.id).first()
        return cart

    def update_cart_item(self, user_id: int, item_id: int, quantity: int):
        cart = self.get_or_create_cart(user_id)
        cart_item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()

        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        if quantity <= 0:
            self.db.delete(cart_item)
        else:
            cart_item.quantity = quantity
        
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def delete_cart_item(self, user_id: int, item_id: int):
        cart = self.get_or_create_cart(user_id)
        cart_item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()

        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        self.db.delete(cart_item)
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def empty_cart(self, user_id: int):
        cart = self.get_or_create_cart(user_id)
        for item in cart.items:
            self.db.delete(item)
        
        self.db.commit()
        self.db.refresh(cart)
        return cart
