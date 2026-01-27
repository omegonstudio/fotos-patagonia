from pydantic import BaseModel
from typing import List

class AdminCommissionSummary(BaseModel):
    """Summary of commissions for a single photographer."""
    photographer_id: int
    photographer_name: str
    total_commission: float
    total_gross_sales: float # Gross sales for this photographer

class AdminDashboardSchema(BaseModel):
    """Global summary for the admin dashboard."""
    total_photos_sold: int
    total_orders: int
    total_gross_revenue: float
    total_commissions: float # Sum of all commissions paid out
    commissions_by_photographer: List[AdminCommissionSummary]

class RecentSessionInfo(BaseModel):
    """Detailed information about a recent photo session upload."""
    id: int
    photographer_name: str
    start_time: str
    total_photos: int
    status: str

    class Config:
        orm_mode = True

class RecentSession(BaseModel):
    """Schema for a single recent session entry in the dashboard."""
    id: int
    photographer_name: str
    start_time: str
    photo_count: int
    status: str  # e.g., "Completed", "Partial", "Failed"

    class Config:
        orm_mode = True
