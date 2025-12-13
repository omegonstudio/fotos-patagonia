from sqlalchemy.orm import Session
from sqlalchemy import func
from services.base import BaseService
from fastapi import HTTPException, status
from models.photographer import Photographer, PhotographerCreateSchema, PhotographerUpdateSchema
from models.earning import Earning
from models.user import User
from core.permissions import Permissions
from datetime import date, timedelta
from typing import List # Added this import
from pydantic import BaseModel

class EarningsSummarySchema(BaseModel):
    total_earnings: float
    total_earned_photo_fraction: float
    total_orders_involved: int
    photographer_id: int
    start_date: date | None
    end_date: date | None

class PhotographerService(BaseService):
    def __init__(self, db: Session):
        self.db = db
    ############################################################################
    def list_photographers(self):
        photographers = self.db.query(Photographer).all()
        return photographers
    ############################################################################
    def create_photographer(self, ph_in: PhotographerCreateSchema):
        new_ph = Photographer(**ph_in.model_dump())
        # user_id will be set if provided in ph_in
        return self._save_and_refresh(new_ph)
    ############################################################################
    def get_photographer(self, ph_id: int):
        ph = self.db.query(Photographer).filter(Photographer.id==ph_id).first()
        if not ph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photographer not found"
            )
        return ph
    ############################################################################
    def update_photographer(self, ph_id: int, ph_in: PhotographerUpdateSchema):
        ph = self.db.query(Photographer).filter(Photographer.id==ph_id).first()

        if not ph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photographer not found"
            )
        
        updated_data = ph_in.model_dump(exclude_unset=True)
        
        for field, value in updated_data.items():
            setattr(ph, field, value)
        
        return self._save_and_refresh(ph)
    ############################################################################
    def delete_photographer(self, ph_id: int):
        ph = self.db.query(Photographer).filter(Photographer.id==ph_id).first()

        if not ph:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photographer not found"
            )
        return self._delete_and_refresh(ph)

    ############################################################################
    # Earnings Methods
    ############################################################################

    def _check_earnings_permission(self, photographer_id: int, current_user: User):
        """Helper to check if a user can view earnings for a specific photographer."""
        user_permissions = {p.name for p in current_user.role.permissions}
        
        can_view_any = Permissions.VIEW_ANY_EARNINGS.value in user_permissions
        can_view_own = Permissions.VIEW_OWN_EARNINGS.value in user_permissions

        if not can_view_any:
            if not can_view_own or not current_user.photographer or photographer_id != current_user.photographer.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view these earnings."
                )

    def get_photographer_earnings(
        self,
        photographer_id: int,
        current_user: User,
        start_date: date | None = None,
        end_date: date | None = None
    ) -> List[Earning]:
        """
        Returns a detailed list of earnings for a photographer within a date range.
        """
        self._check_earnings_permission(photographer_id, current_user)

        query = self.db.query(Earning).filter(Earning.photographer_id == photographer_id)

        if start_date:
            query = query.filter(Earning.created_at >= start_date)
        if end_date:
            query = query.filter(Earning.created_at < end_date + timedelta(days=1))

        earnings = query.order_by(Earning.created_at.desc()).all()
        return earnings

    def get_photographer_earnings_summary(
        self,
        photographer_id: int,
        current_user: User,
        start_date: date | None = None,
        end_date: date | None = None
    ) -> EarningsSummarySchema:
        """
        Returns a summary of earnings for a photographer within a date range.
        """
        self._check_earnings_permission(photographer_id, current_user)

        query = self.db.query(
            func.sum(Earning.amount).label("total_amount"),
            func.sum(Earning.earned_photo_fraction).label("total_earned_photo_fraction"),
            func.count(Earning.order_id.distinct()).label("total_orders_involved")
        ).filter(Earning.photographer_id == photographer_id)

        if start_date:
            query = query.filter(Earning.created_at >= start_date)
        if end_date:
            query = query.filter(Earning.created_at < end_date + timedelta(days=1))

        summary = query.first()

        return EarningsSummarySchema(
            total_earnings=summary.total_amount or 0,
            total_earned_photo_fraction=summary.total_earned_photo_fraction or 0,
            total_orders_involved=summary.total_orders_involved or 0,
            photographer_id=photographer_id,
            start_date=start_date,
            end_date=end_date
        )

    def get_all_earnings_summaries(self) -> List[dict]:
        """
        Returns a summary of total earnings for every photographer.
        """
        summaries = self.db.query(
            Photographer.id,
            Photographer.name,
            func.sum(Earning.amount).label("total_earnings")
        ).join(Earning, Earning.photographer_id == Photographer.id)\
         .group_by(Photographer.id, Photographer.name)\
         .order_by(Photographer.name)\
         .all()
        
        return [
            {"photographer_id": id, "photographer_name": name, "total_earnings": total or 0}
            for id, name, total in summaries
        ]
