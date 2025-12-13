from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from deps import get_db, get_current_user
from services.auth import AuthService
from models.user import User
from models.user import UserSchema

from fastapi.security import OAuth2PasswordRequestForm
from models.user import UserCreateSchema

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/register", response_model=UserSchema, status_code=201)
def register_user(user_in: UserCreateSchema, db: Session = Depends(get_db)):
    return AuthService(db).register_user(user_in=user_in)

@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return AuthService(db).login_user(email=form_data.username, password=form_data.password)

@router.post("/refresh")
def refresh_token(db: Session = Depends(get_db)):
    return AuthService(db).refresh_token()

@router.get("/me", response_model=UserSchema)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout_user(db: Session = Depends(get_db)):
    return AuthService(db).logout_user()
