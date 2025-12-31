from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from deps import get_db, PermissionChecker
from services.photographers import PhotographerService
from models.user import User
from core.permissions import Permissions

router = APIRouter(
    prefix="/earnings",
    tags=["earnings"],
)

@router.get("/summary-all", response_model=List[dict])
def get_all_earnings_summaries(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.VIEW_ANY_EARNINGS]))
):
    """
    Retrieves a summary of earnings for all photographers, optionally filtered by date.
    Restricted to users with 'view_any_earnings' permission.
    """
    return PhotographerService(db).get_all_earnings_summaries(
        start_date=start_date,
        end_date=end_date,
    )
