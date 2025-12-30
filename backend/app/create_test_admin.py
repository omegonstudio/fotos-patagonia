import sys
import os
from sqlalchemy.orm import sessionmaker
from db.session import engine
from models.role import Role
from models.user import UserCreateSchema
from services.users import UserService

# Añadir la raíz del proyecto al path para que los imports funcionen
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Configuración de la sesión de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_admin_user():
    """
    Crea un usuario de prueba con el rol 'Admin'.
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

        test_admin_email = "somos.fotos.patagonia@gmail.com"
        test_admin_password = "sonrei2026" # Contraseña de prueba

        # Verificar si el usuario ya existe
        existing_user = user_service.get_user_by_email(email=test_admin_email)
        if existing_user:
            print(f"El usuario '{test_admin_email}' ya existe. No se creará de nuevo.")
            return

        print(f"Creando usuario administrador de prueba: {test_admin_email}...")
        user_in = UserCreateSchema(
            email=test_admin_email,
            password=test_admin_password,
            role_id=admin_role.id
        )

        user = user_service.create_user(user_in=user_in)
        db.commit()

        print("\n¡Usuario administrador de prueba creado exitosamente!")
        print(f"  Email: {user.email}")
        print(f"  Contraseña: {test_admin_password}")
        print(f"  Rol: {user.role.name}")

    finally:
        db.close()

if __name__ == "__main__":
    create_test_admin_user()
