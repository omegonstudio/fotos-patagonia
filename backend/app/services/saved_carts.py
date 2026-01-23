import random
import string
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.saved_cart import SavedCart, SavedCartSessionCreateSchema
from services.base import BaseService

def _generate_short_id(length=6):
    characters = string.ascii_uppercase + string.digits
    return "".join(random.choice(characters) for _ in range(length))

class SavedCartService(BaseService):
    def _get_unique_public_id(self) -> str:
        while True:
            public_id = _generate_short_id()
            existing = self.db.query(SavedCart).filter(SavedCart.public_id == public_id).first()
            if not existing:
                return public_id

    def create_cart_session(self, cart_state: SavedCartSessionCreateSchema) -> SavedCart:
        public_id = self._get_unique_public_id()
        db_saved_cart = SavedCart(
            public_id=public_id,
            cart_state=cart_state.cart_state
        )
        return self._save_and_refresh(db_saved_cart)

    def get_cart_session_by_public_id(self, public_id: str) -> SavedCart:
        saved_cart = self.db.query(SavedCart).filter(SavedCart.public_id == public_id.upper()).first()
        if not saved_cart:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart session not found")
        return saved_cart

    def list_saved_carts(self) -> list[SavedCart]:
        """Returns a list of all saved carts."""
        return self.db.query(SavedCart).all()

    def get_saved_cart(self, saved_cart_id: int) -> SavedCart:
        """Returns a specific saved cart by its ID."""
        saved_cart = (
            self.db.query(SavedCart)
            .filter(SavedCart.id == saved_cart_id)
            .first()
        )
        if not saved_cart:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved cart not found")
        return saved_cart

    def delete_saved_cart(self, saved_cart_id: int):
        """Deletes a saved cart."""
        db_saved_cart = self.get_saved_cart(saved_cart_id)
        return self._delete_and_refresh(db_saved_cart)

    # Method for sending recovery email is kept for later implementation
    def send_recovery_email(self, cart_id: int):
        # Business logic for sending recovery email for a saved cart
        return {"message": f"SavedCartService: Send recovery email for saved cart {cart_id} logic"}
