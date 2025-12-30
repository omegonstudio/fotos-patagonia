from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.order import Order, OrderItem, OrderStatus, OrderUpdateSchema, PaymentMethod, PaymentStatus
from models.earning import Earning
from models.photo import Photo
from services.base import BaseService
from services.email_service import send_email
from core.config import settings

def process_earnings_for_order_item(db: Session, order_item: OrderItem):
    """
    Calculates and records the earning for a photographer based on a sold OrderItem.
    This is now safe against missing photos or photographers.
    """
    # Ensure photo is loaded
    if not order_item.photo:
        db.refresh(order_item, attribute_names=['photo'])

    # If photo is still None (e.g., data integrity issue), log and skip.
    if not order_item.photo:
        print(f"WARNING: Skipping earning for OrderItem ID {order_item.id} because its associated Photo ID {order_item.photo_id} could not be found.")
        return

    # Ensure photographer is loaded
    if not order_item.photo.photographer:
        db.refresh(order_item.photo, attribute_names=['photographer'])
        
    # If photographer is still not loaded, log and skip.
    if not order_item.photo.photographer:
        print(f"WARNING: Skipping earning for OrderItem ID {order_item.id} because the associated Photo ID {order_item.photo.id} has no photographer.")
        return

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
    def _build_order_confirmation_email_content(self, order: Order) -> tuple[str, str]:
        if not order.public_id:
            raise ValueError("Order is missing a public_id for email content generation.")

        order_page_link = f"{settings.FRONTEND_URL}/pedidos/{order.public_id}"
        
        subject = f"Confirmación de tu orden #{order.id} en Fotos Patagonia"
        email_body = f"""
        <h1>¡Gracias por tu compra!</h1>
        <p>Hola,</p>
        <p>Tu orden #{order.id} ha sido confirmada.</p>
        <p>Puedes ver los detalles de tu pedido y acceder a tus fotos usando el siguiente enlace:</p>
        <p><a href="{order_page_link}">{order_page_link}</a></p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>Gracias por elegir Fotos Patagonia.</p>
        """
        return subject, email_body


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

    def get_order_by_public_id(self, public_id: str) -> Order:
        order = self.db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.photo),
            joinedload(Order.discount)
        ).filter(Order.public_id == public_id).first()
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
        Marks an order as paid, processes earnings, and sends a confirmation email.
        This is the central function for confirming a payment.
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
        
        self.process_earnings_for_order(order)

        self._save_and_refresh(order)
        
        # --- Send confirmation email ---
        email_to = None
        if order.customer_email:
            email_to = order.customer_email
            print(f"INFO: Found customer_email '{email_to}' for Order ID {order.id}. Using it as the recipient.")
        elif order.user and order.user.email:
            email_to = order.user.email
            print(f"INFO: No customer_email found for Order ID {order.id}. Falling back to user.email '{email_to}'.")

        if email_to:
            subject, email_body = self._build_order_confirmation_email_content(order)
            send_email(
                to_email=email_to,
                subject=subject,
                body=email_body,
                html=True
            )
        else:
            print(f"WARNING: Order ID {order.id} marked as paid but has no email associated (customer_email or user.email). Could not send confirmation email.")
        
        return order

    def update_order_status(self, order_id: int, new_status: OrderStatus, payment_method: PaymentMethod | None = None) -> Order:
        order = self.get_order_details(order_id)

        is_payment_confirmation = (
            new_status in [OrderStatus.PAID, OrderStatus.COMPLETED] and
            order.payment_status == PaymentStatus.PENDING
        )

        if is_payment_confirmation:
            # Siempre usa el método de pago que la orden ya tiene.
            # No se necesita ninguna validación aquí porque la orden debe tener uno.
            return self.mark_order_as_paid(order_id=order.id, payment_method=order.payment_method)
        
        # Para cualquier otro cambio de estado, simplemente actualiza el campo.
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