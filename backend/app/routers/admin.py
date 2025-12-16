from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from deps import get_db, PermissionChecker
from services.admin import AdminService
from schemas.admin import AdminDashboardSchema
from models.user import User
from core.permissions import Permissions

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(PermissionChecker([Permissions.VIEW_ANY_EARNINGS]))]
)

@router.get("/dashboard", response_model=AdminDashboardSchema)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.VIEW_ANY_EARNINGS])) # Redundant but explicit
):
    """
    Provides a global summary of all platform activity, including sales,
    orders, and commissions. Restricted to users with sufficient privileges.
    """
    return AdminService(db).get_dashboard_summary()
