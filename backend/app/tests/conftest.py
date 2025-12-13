# -*- coding: utf-8 -*-
import sys
import os
import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, joinedload
from fastapi.testclient import TestClient
from typing import Generator, Any, Dict
from datetime import datetime

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from db.base import Base
from main import app
from deps import get_db
from db.init_db import init_db as init_roles_and_permissions
from models.user import User, UserCreateSchema # Added UserCreateSchema
from models.role import Role # Added import
from models.permission import Permission # Added import
from core.permissions import Permissions # Added import
from models.photographer import Photographer
from models.photo import Photo
from models.album import Album
from models.photo_session import PhotoSession
from services.users import UserService
from app.core.config import settings

# --- Test Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """
    Creates the database schema and populates it with roles/permissions once per session.
    """
    Base.metadata.create_all(bind=engine)
    
    # Create a temporary session to populate the database with seed data
    db = TestingSessionLocal()
    try:
        # In init_db, we use flush. We need to commit here to make it available for all test sessions.
        init_roles_and_permissions(
            db,
            first_superuser_email="testadmin@example.com",
            first_superuser_password="testpassword"
        )
        db.commit()
    finally:
        db.close()

    yield
    
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(setup_database) -> Generator[Session, Any, None]:
    """
    Creates a new database session for each test function, wrapped in a transaction.
    The database is already populated with roles and permissions by setup_database.
    """
    connection = engine.connect()
    transaction = connection.begin()
    db = TestingSessionLocal(bind=connection)
    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, Any, None]:
    """Creates an API client using the test database session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

# --- User and Auth Fixtures ---

@pytest.fixture(scope="function")
def user_factory(db_session: Session):
    """Factory fixture to create users with specific roles."""
    from models.role import Role
    
    def _create_user(role_name: str, email: str | None = None, password: str = "testpassword") -> User:
        if email is None:
            email = f"{role_name.lower()}_{uuid.uuid4()}@test.com" # Generate unique email
        
        role = db_session.query(Role).filter_by(name=role_name).one()
        user_service = UserService(db_session)

        from models.user import UserCreateSchema
        user_in = UserCreateSchema(email=email, password=password, role_id=role.id)
        
        user = user_service.create_user(user_in=user_in)

        if role_name == "Photographer":
            photographer = Photographer(
                name=email.split('@')[0],
                commission_percentage=10,
                contact_info=email,
                user_id=user.id
            )
            db_session.add(photographer)
            db_session.flush()
            db_session.refresh(user)
            
        return user
    return _create_user

def get_auth_headers(client: TestClient, email: str, password: str = "testpassword") -> Dict[str, str]:
    """Helper function to log in and get auth headers."""
    response = client.post("/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200, f"Failed to log in user {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def admin_client(client: TestClient) -> TestClient:
    """A TestClient authenticated as an Admin user."""
    db = next(client.app.dependency_overrides[get_db]())
    # Retrieve the admin user created by init_db using its fixed email
    admin_user = db.query(User).options(
        joinedload(User.role).joinedload(Role.permissions)
    ).filter(User.email == "testadmin@example.com").first()
    
    if not admin_user:
        raise Exception("Admin user not found in test DB. init_db might have failed or email changed.")
    
    client.headers = get_auth_headers(client, admin_user.email, "testpassword")
    client.user = admin_user
    return client

@pytest.fixture(scope="function")
def supervisor_client(client: TestClient, user_factory) -> TestClient:
    """A TestClient authenticated as a Supervisor user."""
    user = user_factory("Supervisor", "supervisor@test.com")
    client.headers = get_auth_headers(client, user.email)
    return client

@pytest.fixture(scope="function")
def photographer_client(client: TestClient, user_factory) -> TestClient:
    """A TestClient authenticated as a Photographer user."""
    user = user_factory("Photographer", "photographer@test.com")
    client.headers = get_auth_headers(client, user.email)
    # Re-fetch user to ensure photographer relationship is eagerly loaded
    db = next(client.app.dependency_overrides[get_db]())
    client.user = UserService(db).get_user(user.id)
    return client

@pytest.fixture(scope="function")
def customer_client(client: TestClient, user_factory) -> TestClient:
    """A TestClient authenticated as a Customer user."""
    user = user_factory("Customer", "customer.cart@test.com")
    client.headers = get_auth_headers(client, user.email)
    client.user = user
    return client

@pytest.fixture(scope="function")
def another_photographer_client(client: TestClient, user_factory) -> TestClient:
    """A TestClient authenticated as a second, different Photographer user."""
    user = user_factory("Photographer", "another_photographer@test.com")
    client.headers = get_auth_headers(client, user.email)
    # Re-fetch user to ensure photographer relationship is eagerly loaded
    db = next(client.app.dependency_overrides[get_db]())
    client.user = UserService(db).get_user(user.id)
    return client

@pytest.fixture(scope="function")
def test_album(db_session: Session) -> Album:
    """Creates a test album."""
    album = Album(name="Test Album", description="A test album.")
    db_session.add(album)
    db_session.commit()
    db_session.refresh(album)
    return album

@pytest.fixture(scope="function")
def test_photo(db_session: Session, test_album: Album) -> Photo:
    """Creates a test photo."""
    # Assuming a default photographer and session for simplicity for this fixture.
    # In more complex scenarios, these would also come from fixtures or factories.
    photographer = db_session.query(Photographer).first()
    if not photographer:
        user = UserService(db_session).create_user(UserCreateSchema(
            email=f"default_ph_{uuid.uuid4()}@test.com", password="testpassword", role_id=db_session.query(Role).filter_by(name="Photographer").one().id
        ))
        photographer = Photographer(name="Default PH", commission_percentage=10, contact_info="default@ph.com", user_id=user.id)
        db_session.add(photographer)
        db_session.commit()
        db_session.refresh(photographer)

    photo_session = PhotoSession(
        event_name="Default Photo Session",
        event_date=datetime.utcnow(),
        location="Default Location",
        album_id=test_album.id,
        photographer_id=photographer.id
    )
    db_session.add(photo_session)
    db_session.commit()
    db_session.refresh(photo_session)

    photo = Photo(
        filename="test_photo.jpg",
        description="A photo for testing.",
        price=10.0,
        url="http://example.com/test_photo.jpg",
        watermark_url="http://example.com/test_photo_wm.jpg",
        photographer_id=photographer.id,
        session_id=photo_session.id,
    )
    db_session.add(photo)
    db_session.commit()
    db_session.refresh(photo)
    return photo
