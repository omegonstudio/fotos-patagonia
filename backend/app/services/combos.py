from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from models.combo import Combo, ComboCreateSchema, ComboUpdateSchema
from services.base import BaseService

class ComboService(BaseService):
    def list_combos(self) -> List[Combo]:
        """Returns a list of all combos."""
        return self.db.query(Combo).all()

    def get_combo(self, combo_id: int) -> Combo:
        """Returns a specific combo by its ID."""
        combo = self.db.query(Combo).filter(Combo.id == combo_id).first()
        if not combo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Combo not found")
        return combo

    def create_combo(self, combo_in: ComboCreateSchema) -> Combo:
        """Creates a new combo record in the database."""
        # Check if combo with the same name already exists (case-insensitive)
        existing_combo = self.db.query(Combo).filter(Combo.name.ilike(combo_in.name)).first()
        if existing_combo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Combo with name '{combo_in.name}' already exists."
            )
        
        db_combo = Combo(**combo_in.model_dump())
        return self._save_and_refresh(db_combo)

    def update_combo(self, combo_id: int, combo_in: ComboUpdateSchema) -> Combo:
        """Updates an existing combo record."""
        combo = self.get_combo(combo_id)
        
        # Check if new name is already taken by another combo
        if combo_in.name and combo.name != combo_in.name:
            existing_combo = self.db.query(Combo).filter(Combo.name.ilike(combo_in.name)).first()
            if existing_combo and existing_combo.id != combo_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Combo with name '{combo_in.name}' already exists."
                )
            
        update_data = combo_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(combo, field, value)
            
        return self._save_and_refresh(combo)

    def delete_combo(self, combo_id: int) -> None:
        """Deletes a combo record."""
        combo = self.get_combo(combo_id)
        self.db.delete(combo)
        self.db.commit()
        return