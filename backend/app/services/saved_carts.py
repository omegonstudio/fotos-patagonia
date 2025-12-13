from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.saved_cart import SavedCart, SavedCartCreateSchema
from services.base import BaseService

class SavedCartService(BaseService):
    def list_saved_carts(self) -> list[SavedCart]:
        """Returns a list of all saved carts with their associated cart eagerly loaded."""
        return self.db.query(SavedCart).options(joinedload(SavedCart.cart)).all()

    def get_saved_cart(self, saved_cart_id: int) -> SavedCart:
        """Returns a specific saved cart by its ID with its associated cart eagerly loaded."""
        saved_cart = (
            self.db.query(SavedCart)
            .options(joinedload(SavedCart.cart))
            .filter(SavedCart.id == saved_cart_id)
            .first()
        )
        if not saved_cart:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved cart not found")
        return saved_cart

    def create_saved_cart(self, saved_cart_in: SavedCartCreateSchema) -> SavedCart:
        """Creates a new saved cart."""
        db_saved_cart = SavedCart(**saved_cart_in.model_dump())
        return self._save_and_refresh(db_saved_cart)

    def delete_saved_cart(self, saved_cart_id: int):
        """Deletes a saved cart."""
        db_saved_cart = self.get_saved_cart(saved_cart_id)
        return self._delete_and_refresh(db_saved_cart)

    # Method for sending recovery email is kept for later implementation
    def send_recovery_email(self, cart_id: int):
        # Business logic for sending recovery email for a saved cart
        return {"message": f"SavedCartService: Send recovery email for saved cart {cart_id} logic"}
