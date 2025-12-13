from fastapi.testclient import TestClient

def test_create_role(admin_client: TestClient):
    """Test para crear un rol."""
    # Note: Role names should be unique. Using a unique name.
    role_data = {"name": "Test Role Create", "description": "A test role"}
    response = admin_client.post("/roles/", json=role_data)
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == role_data["name"]
    assert "id" in data

def test_get_role(admin_client: TestClient):
    """Test para obtener un rol por su ID."""
    role_data = {"name": "Get Role Test", "description": "Role for get test"}
    create_response = admin_client.post("/roles/", json=role_data)
    assert create_response.status_code == 201, create_response.text
    role_id = create_response.json()["id"]

    response = admin_client.get(f"/roles/{role_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == role_id
    assert data["name"] == role_data["name"]

def test_update_role(admin_client: TestClient):
    """Test para actualizar un rol."""
    role_data = {"name": "Update Role Test", "description": "Before update"}
    create_response = admin_client.post("/roles/", json=role_data)
    assert create_response.status_code == 201, create_response.text
    role_id = create_response.json()["id"]

    update_data = {"name": "Updated Role Name", "description": "After update"}
    response = admin_client.put(f"/roles/{role_id}", json=update_data)
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]

def test_delete_role(admin_client: TestClient):
    """Test para eliminar un rol."""
    role_data = {"name": "Delete Role Test", "description": "To be deleted"}
    create_response = admin_client.post("/roles/", json=role_data)
    assert create_response.status_code == 201, create_response.text
    role_id = create_response.json()["id"]

    response = admin_client.delete(f"/roles/{role_id}")
    assert response.status_code == 204, response.text

    get_response = admin_client.get(f"/roles/{role_id}")
    assert get_response.status_code == 404, get_response.text