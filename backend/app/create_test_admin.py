import sys
import os
import argparse
from sqlalchemy.orm import sessionmaker
from db.session import engine
from models.role import Role
from models.user import UserCreateSchema
from services.users import UserService

# Añadir la raíz del proyecto al path para que los imports funcionen
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configuración de la sesión de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_admin_user(email, password):
    """
    Crea un usuario administrador con el email y contraseña proporcionados.
    """
    db = SessionLocal()
    try:
        print("Buscando el rol 'Admin'...")
        admin_role = db.query(Role).filter(Role.name == "Admin").first()

        if not admin_role:
            print("Error: No se encontró el rol 'Admin'. Por favor, asegúrate de que la base de datos esté inicializada (con initial_data.py)."                  " Se requiere un rol de Admin para crear un usuario admin.")
            return

        print(f"Rol 'Admin' encontrado con ID: {admin_role.id}")

        user_service = UserService(db)

        # Verificar si el usuario ya existe
        existing_user = user_service.get_user_by_email(email=email)
        if existing_user:
            print(f"El usuario '{email}' ya existe. No se creará de nuevo.")
            return

        print(f"Creando usuario administrador: {email}...")
        user_in = UserCreateSchema(
            email=email,
            password=password,
            role_id=admin_role.id
        )

        user = user_service.create_user(user_in=user_in)
        db.commit()

        print("\n¡Usuario administrador creado exitosamente!")
        print(f"  Email: {user.email}")
        print(f"  Rol: {user.role.name}")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear un nuevo usuario administrador.")
    parser.add_argument("email", type=str, help="El email del nuevo administrador.")
    parser.add_argument("password", type=str, help="La contraseña del nuevo administrador.")
    args = parser.parse_args()

    create_admin_user(args.email, args.password)
