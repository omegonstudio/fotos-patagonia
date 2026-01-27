from sqlalchemy.orm import Session
from sqlalchemy import func, case
from services.base import BaseService
from models.order import Order, OrderItem, PaymentStatus
from models.photo import Photo
from models.photographer import Photographer
from models.earning import Earning
from schemas.admin import AdminDashboardSchema, AdminCommissionSummary, RecentSessionInfo
from typing import List

class AdminService(BaseService):
    def get_dashboard_summary(self) -> AdminDashboardSchema:
        """
        Calculates and returns a global summary for the admin dashboard.
        """
        db = self.db

        # --- 1. Global Stats ---
        # Query on paid orders only
        global_stats_query = db.query(
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total).label("total_gross_revenue"),
            func.sum(OrderItem.quantity).label("total_photos_sold")
        ).join(OrderItem, Order.id == OrderItem.order_id)\
         .filter(Order.payment_status == PaymentStatus.PAID)
        
        global_stats = global_stats_query.first()

        # --- 2. Per-Photographer Stats ---
        # To get gross sales and commissions, we join several tables.
        # We calculate gross sales from OrderItems and net earnings from Earnings.
        # Commission = Gross Sales - Net Earnings.
        
        # Subquery to get gross sales per photographer
        gross_sales_subquery = db.query(
            Photographer.id.label("photographer_id"),
            func.sum(OrderItem.price * OrderItem.quantity).label("gross_sales")
        ).join(Photo, Photographer.id == Photo.photographer_id)\
         .join(OrderItem, Photo.id == OrderItem.photo_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.payment_status == PaymentStatus.PAID)\
         .group_by(Photographer.id)\
         .subquery()

        # Subquery to get net earnings per photographer
        net_earnings_subquery = db.query(
            Earning.photographer_id.label("photographer_id"),
            func.sum(Earning.amount).label("net_earnings")
        ).group_by(Earning.photographer_id)\
         .subquery()
        
        # Main query to combine the data
        commission_summary_query = db.query(
            Photographer.id,
            Photographer.name,
            gross_sales_subquery.c.gross_sales,
            net_earnings_subquery.c.net_earnings
        ).outerjoin(gross_sales_subquery, Photographer.id == gross_sales_subquery.c.photographer_id)\
         .outerjoin(net_earnings_subquery, Photographer.id == net_earnings_subquery.c.photographer_id)\
         .order_by(Photographer.name)
        
        photographer_stats = commission_summary_query.all()

        commissions_by_photographer: List[AdminCommissionSummary] = []
        total_commissions = 0.0
        for p_id, p_name, gross, net in photographer_stats:
            gross_sales = gross or 0
            net_earnings = net or 0
            commission = gross_sales - net_earnings
            total_commissions += commission
            
            commissions_by_photographer.append(
                AdminCommissionSummary(
                    photographer_id=p_id,
                    photographer_name=p_name,
                    total_commission=round(commission, 2),
                    total_gross_sales=round(gross_sales, 2)
                )
            )

        # --- 3. Assemble final schema ---
        return AdminDashboardSchema(
            total_photos_sold=global_stats.total_photos_sold or 0,
            total_orders=global_stats.total_orders or 0,
            total_gross_revenue=round(global_stats.total_gross_revenue or 0, 2),
            total_commissions=round(total_commissions, 2),
            commissions_by_photographer=commissions_by_photographer
        )

    def get_recent_sessions(self) -> List[RecentSessionInfo]:
        """
        Retrieves a summary of the last 5 photo sessions for the admin dashboard.
        """
        from models.photo_session import PhotoSession
        
        sessions_query = self.db.query(
            PhotoSession.id,
            Photographer.name.label("photographer_name"),
            func.to_char(PhotoSession.event_date, 'YYYY-MM-DD HH24:MI:SS').label("start_time"),
            func.count(Photo.id).label("total_photos"),
            case(
                (func.count(Photo.id) > 0, "Completado"),
                else_ = "Pendiente"
            ).label("status")
        ).join(Photographer, PhotoSession.photographer_id == Photographer.id)\
         .outerjoin(Photo, PhotoSession.id == Photo.session_id)\
         .group_by(PhotoSession.id, Photographer.name)\
         .order_by(PhotoSession.event_date.desc())\
         .limit(5)
        
        recent_sessions = sessions_query.all()
        
        return [
            RecentSessionInfo(
                id=r.id,
                photographer_name=r.photographer_name,
                start_time=r.start_time,
                total_photos=r.total_photos,
                status=r.status
            ) for r in recent_sessions
        ]

