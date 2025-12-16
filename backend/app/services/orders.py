from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.order import Order, OrderItem, OrderStatus, OrderUpdateSchema, PaymentMethod, PaymentStatus
from models.earning import Earning
from models.photo import Photo
from services.base import BaseService

def process_earnings_for_order_item(db: Session, order_item: OrderItem):
    """
    Calculates and records the earning for a photographer based on a sold OrderItem.
    """
    # Ensure photo and photographer are loaded
    if not order_item.photo:
        db.refresh(order_item, attribute_names=['photo'])
    if not order_item.photo.photographer:
        db.refresh(order_item.photo, attribute_names=['photographer'])

    photographer = order_item.photo.photographer
    item_price = order_item.price * order_item.quantity
    commission_percentage = photographer.commission_percentage
    
    # Monetary earning calculation
    commission_amount = item_price * (commission_percentage / 100.0)
    earned_amount = item_price - commission_amount

    # Photo fraction earning calculation
    photographer_fraction = 1 - (commission_percentage / 100.0)
    earned_photo_fraction = photographer_fraction * order_item.quantity

    new_earning = Earning(
        photographer_id=photographer.id,
        order_id=order_item.order_id, # Link to the order
        order_item_id=order_item.id,
        amount=earned_amount,
        commission_applied=commission_percentage,
        earned_photo_fraction=earned_photo_fraction
    )
    db.add(new_earning)
    # No commit here, as it should be part of a larger transaction
    return new_earning

class OrderService(BaseService):
    def list_all_orders(self) -> list[Order]:
        return self.db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.photo),
            joinedload(Order.discount)
        ).all()

    def list_my_orders(self, user_id: int) -> list[Order]:
        return self.db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.photo),
            joinedload(Order.discount)
        ).filter(Order.user_id == user_id).all()

    def get_order_details(self, order_id: int) -> Order:
        order = self.db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.photo),
            joinedload(Order.discount),
            joinedload(Order.earnings)
        ).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def process_earnings_for_order(self, order: Order):
        """
        Calculates and records earnings for all items in an order by calling
        process_earnings_for_order_item for each item.
        """
        # Ensure items and their photos/photographers are loaded
        order = self.db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.photo).joinedload(Photo.photographer)
        ).filter(Order.id == order.id).first()

        if not order or not order.items:
            return

        for item in order.items:
            process_earnings_for_order_item(self.db, item)
        
        # The commit will be handled by the calling function (e.g., mark_order_as_paid)
        return

    def mark_order_as_paid(self, order_id: int, payment_method: PaymentMethod, external_payment_id: str | None = None) -> Order:
        """
        Marca una orden como pagada y procesa las ganancias.
        Esta es la función central para confirmar un pago.
        """
        order = self.get_order_details(order_id)
        if order.payment_status == PaymentStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order has already been paid."
            )

        order.payment_method = payment_method
        order.payment_status = PaymentStatus.PAID
        order.order_status = OrderStatus.PAID
        if external_payment_id:
            order.external_payment_id = external_payment_id
        
        # Procesar ganancias antes de guardar para asegurar que todo sea una transacción
        self.process_earnings_for_order(order)

        self._save_and_refresh(order)
        return order

    def update_order_status(self, order_id: int, new_status: OrderStatus, payment_method: PaymentMethod | None = None) -> Order:
        order = self.get_order_details(order_id)

        is_manual_payment_confirmation = (
            new_status in [OrderStatus.PAID, OrderStatus.COMPLETED] and
            order.payment_status == PaymentStatus.PENDING
        )

        if is_manual_payment_confirmation:
            if not payment_method or payment_method not in [PaymentMethod.EFECTIVO, PaymentMethod.TRANSFERENCIA, PaymentMethod.POSNET]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A payment method ('EFECTIVO', 'TRANSFERENCIA', or 'POSNET') is required to mark this order as paid."
                )
            # Usar la lógica centralizada de pago
            return self.mark_order_as_paid(order_id=order.id, payment_method=payment_method)
        
        # Para otros cambios de estado, solo actualizar el campo
        order.order_status = new_status
        self._save_and_refresh(order)
        return order

    def edit_order(self, order_id: int, order_in: OrderUpdateSchema) -> Order:
        order = self.get_order_details(order_id)
        update_data = order_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)
        self._save_and_refresh(order)
        return order

    def send_order_email(self, order_id: int):
        # Business logic for sending a custom email for an order
        return {"message": f"OrderService: Send order {order_id} email logic"}

    def generate_qr_code(self, order_id: int):
        # Business logic for generating QR code for an order
        return {"message": f"OrderService: Generate QR code for order {order_id} logic"}
