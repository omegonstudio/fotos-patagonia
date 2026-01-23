from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from deps import get_db
from services.saved_carts import SavedCartService
from models.saved_cart import SavedCartSchema, SavedCartSessionCreateSchema

router = APIRouter(
    prefix="/saved-carts",
    tags=["saved-carts"],
)

@router.post("/sessions/", response_model=SavedCartSchema, status_code=status.HTTP_201_CREATED)
def create_cart_session(
    cart_state_in: SavedCartSessionCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Saves a cart session and returns it with a new public ID.
    """
    return SavedCartService(db).create_cart_session(cart_state=cart_state_in)

@router.get("/sessions/{public_id}", response_model=SavedCartSchema)
def get_cart_session(
    public_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves a saved cart session by its public ID.
    """
    return SavedCartService(db).get_cart_session_by_public_id(public_id=public_id)