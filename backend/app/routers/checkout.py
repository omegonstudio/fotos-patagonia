from fastapi import APIRouter, Depends, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from deps import get_db, get_current_user
from services.checkout import CheckoutService
from models.order import OrderCreateSchema, OrderSchema
from models.user import User

router = APIRouter(
    prefix="/checkout",
    tags=["checkout"],
)

class CreatePreferencePayload(BaseModel):
    order_id: int

@router.post("/mercadopago/create-preference")
def create_mercadopago_preference(payload: CreatePreferencePayload, db: Session = Depends(get_db)):
    return CheckoutService(db).create_mercadopago_preference(order_id=payload.order_id)

@router.post("/mercadopago/webhook", status_code=status.HTTP_200_OK)
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    # Mercado Pago can send notifications as either a JSON body or as query parameters.
    # This handler will try to handle both cases.
    
    webhook_data = {}
    
    # First, try to get data from query parameters (for IPN-style notifications)
    query_params = request.query_params
    if "data.id" in query_params and "type" in query_params:
        webhook_data = {
            "type": query_params.get("type"),
            "data": {
                "id": query_params.get("data.id")
            }
        }
        print(f"Received Mercado Pago webhook via query params: {webhook_data}")
    else:
        # If not in query params, try to parse JSON body (for modern webhooks)
        try:
            webhook_data = await request.json()
            print(f"Received Mercado Pago webhook via JSON body: {webhook_data}")
        except Exception:
            print("Webhook received without valid query params or JSON body.")
            # Return 200 to prevent Mercado Pago from retrying a request we can't process.
            return {"status": "request ignored"}

    if not webhook_data:
        return {"status": "no data received"}

    return CheckoutService(db).mercadopago_webhook(webhook_data=webhook_data)

@router.get("/status")
def get_checkout_status(db: Session = Depends(get_db)):
    return CheckoutService(db).get_checkout_status()

@router.post("/local")
def register_local_sale(db: Session = Depends(get_db)):
    return CheckoutService(db).register_local_sale()

@router.post("/create-order", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreateSchema, db: Session = Depends(get_db)):
    return CheckoutService(db).create_order(order_in=order_in)
