from sqlalchemy.orm import Session, joinedload
from models.cart import Cart, CartItem, CartItemCreateSchema
from fastapi import HTTPException

class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, user_id: int | None = None, guest_id: str | None = None) -> Cart:
        if user_id is None and guest_id is None:
            raise ValueError("Se requiere user_id o guest_id")

        query = self.db.query(Cart).options(joinedload(Cart.items).joinedload(CartItem.photo))
        
        if user_id:
            cart = query.filter(Cart.user_id == user_id).first()
        else: # guest_id is not None
            cart = query.filter(Cart.guest_id == guest_id).first()
        
        if not cart:
            if user_id:
                cart = Cart(user_id=user_id)
            else:
                cart = Cart(guest_id=guest_id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
            # Re-fetch with relationships
            cart = query.filter(Cart.id == cart.id).first()
            
        return cart

    def add_item_to_cart(self, user_id: int | None, guest_id: str | None, item: CartItemCreateSchema):
        cart = self.get_or_create_cart(user_id, guest_id)
        cart_item = self.db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.photo_id == item.photo_id).first()

        if cart_item:
            cart_item.quantity += item.quantity
        else:
            cart_item = CartItem(cart_id=cart.id, photo_id=item.photo_id, quantity=item.quantity)
            self.db.add(cart_item)
        
        self.db.commit()
        self.db.refresh(cart)
        return self.get_or_create_cart(user_id, guest_id) # Re-fetch

    def update_cart_item(self, user_id: int | None, guest_id: str | None, item_id: int, quantity: int):
        cart = self.get_or_create_cart(user_id, guest_id)
        cart_item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()

        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        if quantity <= 0:
            self.db.delete(cart_item)
        else:
            cart_item.quantity = quantity
        
        self.db.commit()
        self.db.refresh(cart)
        return self.get_or_create_cart(user_id, guest_id)

    def delete_cart_item(self, user_id: int | None, guest_id: str | None, item_id: int):
        cart = self.get_or_create_cart(user_id, guest_id)
        cart_item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()

        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        self.db.delete(cart_item)
        self.db.commit()
        self.db.refresh(cart)
        return self.get_or_create_cart(user_id, guest_id)

    def empty_cart(self, user_id: int | None, guest_id: str | None):
        cart = self.get_or_create_cart(user_id, guest_id)
        for item in cart.items:
            self.db.delete(item)
        
        self.db.commit()
        self.db.refresh(cart)
        return self.get_or_create_cart(user_id, guest_id)

    def transfer_guest_cart_to_user(self, guest_id: str, user_id: int):
        guest_cart = self.db.query(Cart).options(joinedload(Cart.items)).filter(Cart.guest_id == guest_id).first()
        if not guest_cart:
            return

        user_cart = self.get_or_create_cart(user_id=user_id)

        # Si el carrito del usuario ya tiene items, fusionamos
        for guest_item in guest_cart.items:
            # Buscamos si el mismo producto ya existe en el carrito del usuario
            user_item = self.db.query(CartItem).filter(
                CartItem.cart_id == user_cart.id,
                CartItem.photo_id == guest_item.photo_id
            ).first()

            if user_item:
                # Si existe, sumamos las cantidades
                user_item.quantity += guest_item.quantity
            else:
                # Si no existe, lo movemos al carrito del usuario
                guest_item.cart_id = user_cart.id
        
        self.db.delete(guest_cart)
        self.db.commit()
