import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Import models
from models.user import User
from models.photographer import Photographer
from models.album import Album

# --- Fixtures for Session Test Setup ---

@pytest.fixture(scope="function")
def photographer_for_session(db_session: Session, user_factory) -> Photographer:
    """Creates a photographer for session tests."""
    user = user_factory("Photographer", "photographer.session@test.com")
    db_session.flush()
    db_session.refresh(user)
    return user.photographer

@pytest.fixture(scope="function")
def album_for_session(db_session: Session, photographer_for_session: Photographer) -> Album:
    """Creates an album for session tests, owned by the photographer."""
    album = Album(
        name="Session Test Album",
        description="An album for session tests"
    )
    db_session.add(album)
    db_session.flush()
    db_session.refresh(album)
    return album

# --- Session API Tests ---

def test_create_session(photographer_client: TestClient, album_for_session: Album):
    """A photographer can create a session for their own album."""
    # The photographer_client is authenticated as 'photographer@test.com'
    # The album_for_session is owned by 'photographer.session@test.com'
    # We need to ensure the client is the owner of the album.
    # For simplicity, we'll use the photographer_client to create its own album.
    
    album_data = {"name": "My Session Album", "description": "An album for my session"}
    create_album_response = photographer_client.post("/albums/", json=album_data)
    assert create_album_response.status_code == 201
    my_album_id = create_album_response.json()["id"]
    my_photographer_id = photographer_client.user.photographer.id

    session_data = {
        "event_name": "Test Session",
        "description": "A test photo session",
        "event_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "location": "Test Location",
        "photographer_id": my_photographer_id,
        "album_id": my_album_id
    }
    response = photographer_client.post("/sessions/", json=session_data)
    
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["event_name"] == session_data["event_name"]
    assert data["photographer"]["id"] == my_photographer_id
    assert data["album"]["id"] == my_album_id

def test_get_session(photographer_client: TestClient, client: TestClient):
    """Any client can get a session."""
    album_data = {"name": "My Session Album", "description": "An album for my session"}
    create_album_response = photographer_client.post("/albums/", json=album_data)
    my_album_id = create_album_response.json()["id"]
    my_photographer_id = photographer_client.user.photographer.id

    session_data = {
        "event_name": "Get Session",
        "event_date": (datetime.now() + timedelta(days=2)).isoformat(),
        "location": "Get Location",
        "photographer_id": my_photographer_id,
        "album_id": my_album_id
    }
    create_response = photographer_client.post("/sessions/", json=session_data)
    assert create_response.status_code == 201, create_response.text
    session_id = create_response.json()["id"]

    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == session_id

def test_update_session(supervisor_client: TestClient, photographer_client: TestClient):
    """A supervisor can update a session."""
    album_data = {"name": "My Session Album", "description": "An album for my session"}
    create_album_response = photographer_client.post("/albums/", json=album_data)
    my_album_id = create_album_response.json()["id"]
    my_photographer_id = photographer_client.user.photographer.id

    session_data = {
        "event_name": "Update Session",
        "event_date": (datetime.now() + timedelta(days=3)).isoformat(),
        "location": "Update Location",
        "photographer_id": my_photographer_id,
        "album_id": my_album_id
    }
    create_response = photographer_client.post("/sessions/", json=session_data)
    assert create_response.status_code == 201, create_response.text
    session_id = create_response.json()["id"]

    update_data = {"event_name": "Updated Session Name", "location": "Updated Location"}
    # Use supervisor to update, as they have EDIT_ANY_ALBUM permission
    from conftest import get_auth_headers
    supervisor_client.headers = get_auth_headers(supervisor_client, "supervisor@test.com") # Re-authenticate
    response = supervisor_client.put(f"/sessions/{session_id}", json=update_data)
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["event_name"] == update_data["event_name"]

def test_delete_session(supervisor_client: TestClient, photographer_client: TestClient):
    """A supervisor can delete a session."""
    album_data = {"name": "My Session Album", "description": "An album for my session"}
    create_album_response = photographer_client.post("/albums/", json=album_data)
    my_album_id = create_album_response.json()["id"]
    my_photographer_id = photographer_client.user.photographer.id

    session_data = {
        "event_name": "Delete Session",
        "event_date": (datetime.now() + timedelta(days=4)).isoformat(),
        "location": "Delete Location",
        "photographer_id": my_photographer_id,
        "album_id": my_album_id
    }
    create_response = photographer_client.post("/sessions/", json=session_data)
    assert create_response.status_code == 201, create_response.text
    session_id = create_response.json()["id"]

    # Use supervisor to delete
    from conftest import get_auth_headers
    supervisor_client.headers = get_auth_headers(supervisor_client, "supervisor@test.com") # Re-authenticate
    response = supervisor_client.delete(f"/sessions/{session_id}")
    assert response.status_code == 204, response.text

    get_response = supervisor_client.get(f"/sessions/{session_id}")
    assert get_response.status_code == 404, get_response.text
