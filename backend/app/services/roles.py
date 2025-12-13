from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models.role import Role, RoleCreateSchema, RoleUpdateSchema
from services.base import BaseService

class RoleService(BaseService):
    def list_roles(self) -> list[Role]:
        """Returns a list of all roles with their permissions eagerly loaded."""
        return self.db.query(Role).options(joinedload(Role.permissions)).all()

    def get_role(self, role_id: int) -> Role:
        """Returns a specific role by its ID with its permissions eagerly loaded."""
        role = (
            self.db.query(Role)
            .options(joinedload(Role.permissions))
            .filter(Role.id == role_id)
            .first()
        )
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        return role

    def create_role(self, role_in: RoleCreateSchema) -> Role:
        """Creates a new role."""
        db_role = Role(**role_in.model_dump())
        return self._save_and_refresh(db_role)

    def update_role(self, role_id: int, role_in: RoleUpdateSchema) -> Role:
        """Updates an existing role."""
        db_role = self.get_role(role_id)
        
        update_data = role_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_role, field, value)
            
        return self._save_and_refresh(db_role)

    def delete_role(self, role_id: int):
        """Deletes a role."""
        db_role = self.get_role(role_id)
        return self._delete_and_refresh(db_role)

    # TODO: Implement logic for assigning/revoking permissions
    # def assign_permission_to_role(self, role_id: int, permission_id: int):
    #     ...
