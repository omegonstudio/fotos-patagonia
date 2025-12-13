from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

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
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.VIEW_ANY_EARNINGS]))
):
    """
    Retrieves a summary of earnings for all photographers.
    Restricted to users with 'view_any_earnings' permission.
    """
    return PhotographerService(db).get_all_earnings_summaries()
