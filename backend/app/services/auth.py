from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from core.security import get_password_hash, verify_password, create_access_token
from models.user import User, UserCreateSchema

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def _get_user_by_email(self, email: str) -> Optional[User]:
        """Fetches a user from the database by their email, eagerly loading their associated photographer."""
        return self.db.query(User).options(joinedload(User.photographer)).filter(User.email == email).first()

    def register_user(self, user_in: UserCreateSchema) -> User:
        """Creates a new user after validating email uniqueness and hashing the password."""
        if self._get_user_by_email(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            role_id=user_in.role_id,
            is_active=user_in.is_active,
        )

        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticates a user by checking email and password."""
        user = self._get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    def login_user(self, email: str, password: str) -> dict:
        """Handles user login, returning a JWT token upon successful authentication."""
        user = self.authenticate_user(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(subject=user.id)
        response_data = {"access_token": access_token, "token_type": "bearer"}
        if user.photographer:
            response_data["photographer_id"] = user.photographer.id
        return response_data

    def refresh_token(self):
        # Business logic for refreshing JWT token
        return {"message": "AuthService: Refresh token logic"}

    def logout_user(self):
        """Returns a success message for JWT client-side logout."""
        return {"message": "Logout successful"}
