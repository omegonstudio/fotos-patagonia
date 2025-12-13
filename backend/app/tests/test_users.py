import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Import models
from models.role import Role

# --- Fixtures for User Test Setup ---

@pytest.fixture(scope="function")
def role_for_user_test(admin_client: TestClient) -> int:
    """Creates a new, unique role for user tests using the API and returns its ID."""
    # Using the API to create the role as role management is a separate concern.
    # A unique name is used to prevent conflicts between test runs.
    import uuid
    role_name = f"UserTestRole_{uuid.uuid4()}"
    role_data = {"name": role_name, "description": "A role for user tests"}
    response = admin_client.post("/roles/", json=role_data)
    assert response.status_code == 201, response.text
    return response.json()["id"]

# --- User API Tests ---

def test_create_user(supervisor_client: TestClient, role_for_user_test: int):
    """Test for creating a user."""
    user_data = {
        "email": "test_create@example.com",
        "password": "testpass",
        "is_active": True,
        "role_id": role_for_user_test
    }
    response = supervisor_client.post("/users/", json=user_data)
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert "role" in data
    assert data["role"]["id"] == role_for_user_test

def test_get_user(supervisor_client: TestClient, role_for_user_test: int):
    """Test for getting a user by ID."""
    user_data = {"email": "test_get@example.com", "password": "testpass", "role_id": role_for_user_test}
    create_response = supervisor_client.post("/users/", json=user_data)
    assert create_response.status_code == 201, create_response.text
    user_id = create_response.json()["id"]

    response = supervisor_client.get(f"/users/{user_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == user_data["email"]

def test_update_user(supervisor_client: TestClient, role_for_user_test: int):
    """Test for updating a user."""
    user_data = {"email": "test_update@example.com", "password": "testpass", "role_id": role_for_user_test}
    create_response = supervisor_client.post("/users/", json=user_data)
    assert create_response.status_code == 201, create_response.text
    user_id = create_response.json()["id"]

    update_data = {"email": "updated@example.com", "is_active": False}
    response = supervisor_client.put(f"/users/{user_id}", json=update_data)
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == update_data["email"]
    assert data["is_active"] is False

def test_delete_user(supervisor_client: TestClient, role_for_user_test: int):
    """Test for deleting a user."""
    user_data = {"email": "test_delete@example.com", "password": "testpass", "role_id": role_for_user_test}
    create_response = supervisor_client.post("/users/", json=user_data)
    assert create_response.status_code == 201, create_response.text
    user_id = create_response.json()["id"]

    response = supervisor_client.delete(f"/users/{user_id}")
    assert response.status_code == 204, response.text

    get_response = supervisor_client.get(f"/users/{user_id}")
    assert get_response.status_code == 404, get_response.text
