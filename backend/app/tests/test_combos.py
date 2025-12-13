import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Dict

from models.combo import Combo

# --- Test Data ---
COMBO_DATA = {
    "name": "Combo Básico",
    "description": "20 fotos para cualquier ocasión",
    "price": 50.0,
    "totalPhotos": 20,
    "isFullAlbum": False,
    "active": True
}

COMBO_UPDATE_DATA = {
    "name": "Combo Premium",
    "description": "50 fotos de alta calidad",
    "price": 120.0,
    "totalPhotos": 50,
    "isFullAlbum": False,
    "active": True
}

# Fixtures like `db_session`, `test_client`, `supervisor_client`,
# `photographer_client`, `customer_client` are defined in `conftest.py`

# --- Combo CRUD Tests ---

def test_create_combo_as_supervisor(supervisor_client: TestClient):
    response = supervisor_client.post("/combos/", json=COMBO_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == COMBO_DATA["name"]
    assert data["price"] == COMBO_DATA["price"]
    assert "id" in data

def test_create_combo_fails_if_unauthorized(photographer_client: TestClient):
    response = photographer_client.post("/combos/", json=COMBO_DATA)
    assert response.status_code == 403, "Photographers should not be able to create combos."

def test_create_combo_fails_if_name_exists(supervisor_client: TestClient):
    # Create first combo
    supervisor_client.post("/combos/", json=COMBO_DATA)
    # Try to create with same name
    response = supervisor_client.post("/combos/", json=COMBO_DATA)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_list_combos(client: TestClient, supervisor_client: TestClient):
    # Ensure there's at least one combo
    supervisor_client.post("/combos/", json=COMBO_DATA)
    response = client.get("/combos/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert COMBO_DATA["name"] in [combo["name"] for combo in data]

def test_get_combo(client: TestClient, supervisor_client: TestClient):
    create_response = supervisor_client.post("/combos/", json=COMBO_DATA)
    combo_id = create_response.json()["id"]

    response = client.get(f"/combos/{combo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == combo_id
    assert data["name"] == COMBO_DATA["name"]

def test_update_combo(supervisor_client: TestClient):
    create_response = supervisor_client.post("/combos/", json=COMBO_DATA)
    combo_id = create_response.json()["id"]

    response = supervisor_client.put(f"/combos/{combo_id}", json=COMBO_UPDATE_DATA)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == COMBO_UPDATE_DATA["name"]
    assert data["price"] == COMBO_UPDATE_DATA["price"]

def test_update_combo_fails_if_unauthorized(photographer_client: TestClient, supervisor_client: TestClient):
    # Create combo as supervisor
    create_response = supervisor_client.post("/combos/", json=COMBO_DATA)
    combo_id = create_response.json()["id"]
    
    # Attempt to update as photographer
    response = photographer_client.put(f"/combos/{combo_id}", json=COMBO_UPDATE_DATA)
    assert response.status_code == 403

def test_delete_combo(supervisor_client: TestClient):
    create_response = supervisor_client.post("/combos/", json=COMBO_DATA)
    combo_id = create_response.json()["id"]

    response = supervisor_client.delete(f"/combos/{combo_id}")
    assert response.status_code == 204

    get_response = supervisor_client.get(f"/combos/{combo_id}")
    assert get_response.status_code == 404

def test_delete_combo_fails_if_unauthorized(photographer_client: TestClient, supervisor_client: TestClient):
    # Create combo as supervisor
    create_response = supervisor_client.post("/combos/", json=COMBO_DATA)
    combo_id = create_response.json()["id"]

    # Attempt to delete as photographer
    response = photographer_client.delete(f"/combos/{combo_id}")
    assert response.status_code == 403