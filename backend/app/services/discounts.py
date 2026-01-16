from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.discount import Discount, DiscountCreateSchema, DiscountUpdateSchema
from services.base import BaseService
from sqlalchemy import func


class DiscountService(BaseService):
    def __init__(self, db: Session):
        self.db = db

    def list_discounts(self):
        """Returns a list of all discounts."""
        return self.db.query(Discount).all()

    def get_discount(self, discount_id: int):
        """Returns a specific discount by its ID."""
        discount = self.db.query(Discount).filter(Discount.id == discount_id).first()
        if not discount:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Discount not found"
            )
        return discount

    # 👉 NUEVO MÉTODO
    def find_by_code(self, code: str) -> Discount | None:
        """
        Finds a discount by code (case-insensitive).
        Used by /discounts/validate (public endpoint).
        """
        return (
            self.db
            .query(Discount)
            .filter(func.upper(Discount.code) == code.upper())
            .first()
        )

    def create_discount(self, discount_in: DiscountCreateSchema) -> Discount:
        """Creates a new discount."""
        db_discount = Discount(**discount_in.model_dump())
        return self._save_and_refresh(db_discount)

    def update_discount(self, discount_id: int, discount_in: DiscountUpdateSchema) -> Discount:
        """Updates an existing discount."""
        db_discount = self.get_discount(discount_id)
        
        update_data = discount_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_discount, field, value)
            
        return self._save_and_refresh(db_discount)

    def delete_discount(self, discount_id: int):
        """Deletes a discount."""
        db_discount = self.get_discount(discount_id)
        return self._delete_and_refresh(db_discount)
