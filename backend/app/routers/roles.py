from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from deps import get_db, PermissionChecker
from services.roles import RoleService
from models.role import RoleSchema, RoleCreateSchema, RoleUpdateSchema
from core.permissions import Permissions
from models.user import User

router = APIRouter(
    prefix="/roles",
    tags=["roles"],
    dependencies=[Depends(PermissionChecker([Permissions.MANAGE_ROLES]))]
)

@router.get("/", response_model=List[RoleSchema])
def list_roles(db: Session = Depends(get_db)):
    return RoleService(db).list_roles()

@router.post("/", response_model=RoleSchema, status_code=status.HTTP_201_CREATED)
def create_role(role_in: RoleCreateSchema, db: Session = Depends(get_db)):
    return RoleService(db).create_role(role_in=role_in)

@router.get("/{role_id}", response_model=RoleSchema)
def get_role(role_id: int, db: Session = Depends(get_db)):
    return RoleService(db).get_role(role_id=role_id)

@router.put("/{role_id}", response_model=RoleSchema)
def update_role(role_id: int, role_in: RoleUpdateSchema, db: Session = Depends(get_db)):
    return RoleService(db).update_role(role_id=role_id, role_in=role_in)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    return RoleService(db).delete_role(role_id=role_id)