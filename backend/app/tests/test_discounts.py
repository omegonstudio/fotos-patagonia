from fastapi.testclient import TestClient
from datetime import datetime, timedelta

def test_create_discount(supervisor_client: TestClient):
    """Test para crear un descuento."""
    discount_data = {"code": "TESTDISCOUNT", "percentage": 10.0, "expires_at": (datetime.now() + timedelta(days=7)).isoformat(), "is_active": True}
    response = supervisor_client.post("/discounts/", json=discount_data)
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["code"] == discount_data["code"]
    assert "id" in data

def test_get_discount(supervisor_client: TestClient):
    """Test para obtener un descuento por su ID."""
    discount_data = {"code": "GETDISCOUNT", "percentage": 15.0, "expires_at": (datetime.now() + timedelta(days=10)).isoformat(), "is_active": True}
    create_response = supervisor_client.post("/discounts/", json=discount_data)
    assert create_response.status_code == 201, create_response.text
    discount_id = create_response.json()["id"]

    response = supervisor_client.get(f"/discounts/{discount_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == discount_id
    assert data["code"] == discount_data["code"]

def test_update_discount(supervisor_client: TestClient):
    """Test para actualizar un descuento."""
    discount_data = {"code": "UPDATEDISCOUNT", "percentage": 20.0, "expires_at": (datetime.now() + timedelta(days=14)).isoformat(), "is_active": True}
    create_response = supervisor_client.post("/discounts/", json=discount_data)
    assert create_response.status_code == 201, create_response.text
    discount_id = create_response.json()["id"]

    update_data = {"percentage": 25.0, "is_active": False}
    response = supervisor_client.put(f"/discounts/{discount_id}", json=update_data)
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["percentage"] == update_data["percentage"]
    assert data["is_active"] == update_data["is_active"]

def test_delete_discount(supervisor_client: TestClient):
    """Test para eliminar un descuento."""
    discount_data = {"code": "DELETEDISCOUNT", "percentage": 30.0, "expires_at": (datetime.now() + timedelta(days=20)).isoformat(), "is_active": True}
    create_response = supervisor_client.post("/discounts/", json=discount_data)
    assert create_response.status_code == 201, create_response.text
    discount_id = create_response.json()["id"]

    response = supervisor_client.delete(f"/discounts/{discount_id}")
    assert response.status_code == 204, response.text

    get_response = supervisor_client.get(f"/discounts/{discount_id}")
    assert get_response.status_code == 404, get_response.text