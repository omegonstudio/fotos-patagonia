from fastapi.testclient import TestClient
import pytest

@pytest.fixture(scope="function")
def role_for_auth_test(admin_client: TestClient) -> int:
    """
    Creates a role using an authenticated client to be used in auth tests.
    Returns the ID of the created role.
    """
    import uuid
    role_name = f"AuthTestRole_{uuid.uuid4()}"
    role_data = {"name": role_name, "description": "A role for auth testing"}
    response = admin_client.post("/roles/", json=role_data)
    assert response.status_code == 201, "Failed to create role for auth test"
    return response.json()["id"]


def test_register_user(client: TestClient, role_for_auth_test: int):
    """Test user registration, including success and duplicate email failure."""
    user_data = {"email": "register_test@example.com", "password": "s3cr3t", "role_id": role_for_auth_test}
    
    # Register a new user
    response = client.post("/auth/register", json=user_data)
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert "hashed_password" not in data

    # Attempt to register the same email again
    response_fail = client.post("/auth/register", json=user_data)
    assert response_fail.status_code == 400
    assert "Email already registered" in response_fail.json()["detail"]


def test_login_and_get_me(client: TestClient, role_for_auth_test: int):
    """Test user login and accessing a protected endpoint with the token."""
    # 1. Register a user first
    user_data = {"email": "login_test@example.com", "password": "s3cr3t_login", "role_id": role_for_auth_test}
    register_response = client.post("/auth/register", json=user_data)
    assert register_response.status_code == 201, "Failed to register user for login test"

    # 2. Attempt login with incorrect credentials
    login_fail_response = client.post("/auth/login", data={"username": user_data["email"], "password": "wrongpassword"})
    assert login_fail_response.status_code == 401

    # 3. Attempt login with correct credentials
    login_data = {"username": user_data["email"], "password": user_data["password"]}
    response = client.post("/auth/login", data=login_data)
    
    assert response.status_code == 200, response.text
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 4. Use the token to access a protected route
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = client.get("/auth/me", headers=headers)
    
    assert me_response.status_code == 200, me_response.text
    me_data = me_response.json()
    assert me_data["email"] == user_data["email"]
    assert me_data["role"]["id"] == role_for_auth_test