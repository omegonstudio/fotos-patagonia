from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db.session import SessionLocal
from core.config import settings
from models.user import User
from services.users import UserService

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

class TokenData(BaseModel):
    user_id: int | None = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)) -> User:

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",)
        token_data = TokenData(user_id=int(user_id))

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",)
    
    user = UserService(db).get_user(user_id=token_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


from typing import List
from core.permissions import Permissions

def PermissionChecker(required_permissions: List[Permissions], require_all: bool = True):
    """
    Factoría de dependencias que crea un verificador de permisos.
    Toma una lista de permisos requeridos y devuelve una dependencia
    que se puede usar en los endpoints de FastAPI.

    :param required_permissions: Lista de permisos necesarios.
    :param require_all: Si es True, el usuario debe tener TODOS los permisos.
                        Si es False, el usuario debe tener AL MENOS UNO de los permisos.
    """
    def permission_checker_dependency(current_user: User = Depends(get_current_user)):
        user_permissions = {p.name for p in current_user.role.permissions}

        # El rol de Admin con FULL_ACCESS tiene acceso a todo.
        if Permissions.FULL_ACCESS.value in user_permissions:
            return current_user

        required = {p.value for p in required_permissions}
        
        if require_all:
            # El usuario debe tener TODOS los permisos requeridos
            if not required.issubset(user_permissions):
                missing_perms = required - user_permissions
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tienes los permisos necesarios. Faltan: {', '.join(missing_perms)}"
                )
        else:
            # El usuario debe tener AL MENOS UNO de los permisos requeridos
            if not required.intersection(user_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tienes ninguno de los permisos requeridos. Necesitas al menos uno de: {', '.join(required)}"
                )

        return current_user
    return permission_checker_dependency