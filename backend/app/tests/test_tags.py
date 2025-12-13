import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Dict, List

from models.user import User
from models.photo import Photo
from models.album import Album

# --- Test Data ---
TAG_NAMES = ["paisaje", "boda", "retrato", "verano"]

# --- Fixtures ---
# Fixtures like `db_session`, `supervisor_client`, `photographer_client`,
# `another_photographer_client`, `test_photo`, `test_album` are defined in `conftest.py`

# --- Tag CRUD Tests ---

def test_create_tag(supervisor_client: TestClient, db_session: Session):
    response = supervisor_client.post("/tags/", json={"name": "nuevo_tag"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "nuevo_tag"
    assert "id" in data

def test_create_tag_fails_if_unauthorized(photographer_client: TestClient):
    response = photographer_client.post("/tags/", json={"name": "no_permitido"})
    assert response.status_code == 403, "Photographers should not be able to create tags directly."

def test_list_tags(supervisor_client: TestClient):
    # Create a tag first to ensure the list is not empty
    supervisor_client.post("/tags/", json={"name": "listable"})
    response = supervisor_client.get("/tags/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "listable" in [tag["name"] for tag in data]

def test_delete_tag(supervisor_client: TestClient, db_session: Session):
    # Create a tag to delete
    response = supervisor_client.post("/tags/", json={"name": "a_borrar"})
    tag_id = response.json()["id"]

    # Delete it
    delete_response = supervisor_client.delete(f"/tags/{tag_id}")
    assert delete_response.status_code == 204

    # Verify it's gone
    get_response = supervisor_client.get(f"/tags/{tag_id}")
    assert get_response.status_code == 404

# --- Photo-Tag Association Tests ---

def test_set_tags_for_own_photo(photographer_client: TestClient, test_photo: Photo):
    response = photographer_client.post(
        f"/photos/{test_photo.id}/tags",
        json={"tag_names": TAG_NAMES}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == len(TAG_NAMES)
    retrieved_tags = [tag["name"] for tag in data["tags"]]
    for tag_name in TAG_NAMES:
        assert tag_name in retrieved_tags

def test_set_tags_for_any_photo_as_supervisor(supervisor_client: TestClient, test_photo: Photo):
    response = supervisor_client.post(
        f"/photos/{test_photo.id}/tags",
        json={"tag_names": ["supervisor_tag"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "supervisor_tag" in [tag["name"] for tag in data["tags"]]

def test_set_tags_fails_for_other_user_photo(another_photographer_client: TestClient, test_photo: Photo):
    response = another_photographer_client.post(
        f"/photos/{test_photo.id}/tags",
        json={"tag_names": ["fail_tag"]}
    )
    assert response.status_code == 403

def test_set_tags_replaces_old_tags(photographer_client: TestClient, test_photo: Photo):
    # Set initial tags
    photographer_client.post(f"/photos/{test_photo.id}/tags", json={"tag_names": ["viejo_tag"]})
    
    # Set new tags
    new_tags = ["nuevo_tag_1", "nuevo_tag_2"]
    response = photographer_client.post(
        f"/photos/{test_photo.id}/tags",
        json={"tag_names": new_tags}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == 2
    assert "viejo_tag" not in [tag["name"] for tag in data["tags"]]
    assert "nuevo_tag_1" in [tag["name"] for tag in data["tags"]]

# --- Album-Tag Association Tests ---

def test_set_tags_for_album_as_supervisor(supervisor_client: TestClient, test_album: Album):
    response = supervisor_client.post(
        f"/albums/{test_album.id}/tags",
        json={"tag_names": TAG_NAMES}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == len(TAG_NAMES)

def test_set_tags_for_album_fails_as_photographer(photographer_client: TestClient, test_album: Album):
    response = photographer_client.post(
        f"/albums/{test_album.id}/tags",
        json={"tag_names": ["fail_tag"]}
    )
    # Based on our permissions, only users with EDIT_ANY_ALBUM can do this
    assert response.status_code == 403
