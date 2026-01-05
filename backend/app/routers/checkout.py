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
@router.post("/mercadopago/webhook/", status_code=status.HTTP_200_OK, include_in_schema=False)
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    query_params = request.query_params
    print(f"Webhook received. Query Params: {query_params}")

    notification_type = query_params.get("topic") or query_params.get("type")

    if notification_type != "payment":
        print(f"Ignoring webhook of type '{notification_type}'.")
        return {"status": f"webhook ignored, not a payment type"}
    
    payment_id = query_params.get("id") or query_params.get("data.id")

    if not payment_id:
        try:
            body = await request.json()
            if body.get("type") == "payment":
                payment_id = body.get("data", {}).get("id")
        except Exception:
            pass # No body or not JSON, which is fine
    
    if not payment_id:
        print("Webhook received, but contained no processable payment ID.")
        return {"status": "request ignored, no valid data"}
        
    webhook_data = {"type": "payment", "data": {"id": payment_id}}
    print(f"Processing payment webhook for ID: {payment_id}")

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
