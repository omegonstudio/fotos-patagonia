import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

# Import models
from models.user import User
from models.photographer import Photographer
from models.album import Album
from models.photo_session import PhotoSession

# --- Fixtures for Photo Test Setup ---

@pytest.fixture(scope="function")
def photographer_for_photo(db_session: Session, user_factory) -> Photographer:
    """Creates a photographer for photo tests."""
    user = user_factory("Photographer", "photographer.photo@test.com")
    db_session.flush()
    db_session.refresh(user)
    return user.photographer

@pytest.fixture(scope="function")
def session_for_photo(db_session: Session, photographer_for_photo: Photographer) -> PhotoSession:
    """Creates an album and a session for photo tests."""
    album = Album(
        name="Photo Test Album",
        description="An album for photo tests"
    )
    db_session.add(album)
    db_session.flush()
    db_session.refresh(album)

    session = PhotoSession(
        event_name="Photo Test Session",
        event_date=datetime.now(timezone.utc),
        location="Test Studio",
        photographer_id=photographer_for_photo.id,
        album_id=album.id
    )
    db_session.add(session)
    db_session.flush()
    db_session.refresh(session)
    return session

# --- Photo API Tests ---

def test_complete_upload_single_photo(photographer_client: TestClient, monkeypatch, session_for_photo: PhotoSession):
    """
    Test the complete-upload endpoint for a single photo.
    Mocks the storage service to avoid actual S3 calls.
    """
    # Authenticate as the specific photographer from the fixture
    from app.tests.conftest import get_auth_headers
    photographer_user = session_for_photo.photographer.user
    photographer_client.headers = get_auth_headers(photographer_client, photographer_user.email)

    # Mock the storage_service where it's used: in the photos service.
    mock_get_url = "http://minio:9000/fotopatagonia/mocked_photo.jpg?presigned-token"
    monkeypatch.setattr(
        "app.services.photos.storage_service.generate_presigned_get_url",
        lambda object_name: mock_get_url
    )

    completion_request = {
        "photos": [
            {
                "object_name": "photos/some-uuid.jpg",
                "original_filename": "beach_sunset.jpg",
                "description": "A beautiful sunset",
                "price": 15.99,
                "photographer_id": session_for_photo.photographer_id,
                "session_id": session_for_photo.id
            }
        ]
    }

    response = photographer_client.post("/photos/complete-upload", json=completion_request)

    assert response.status_code == 201, response.text
    created_photos = response.json()
    assert len(created_photos) == 1
    
    photo = created_photos[0]
    assert photo["filename"] == "beach_sunset.jpg"
    assert photo["price"] == 15.99
    assert photo["url"] == mock_get_url
    assert photo["photographer"]["id"] == session_for_photo.photographer_id
    assert photo["session_id"] == session_for_photo.id

def test_complete_upload_multiple_photos(photographer_client: TestClient, monkeypatch, session_for_photo: PhotoSession):
    """
    Test the complete-upload endpoint for a list of photos.
    """
    # Authenticate as the specific photographer from the fixture
    from app.tests.conftest import get_auth_headers
    photographer_user = session_for_photo.photographer.user
    photographer_client.headers = get_auth_headers(photographer_client, photographer_user.email)

    mock_urls = [
        "http://minio:9000/fotopatagonia/mocked_photo_1.jpg?token",
        "http://minio:9000/fotopatagonia/mocked_photo_2.png?token"
    ]
    
    # Use a generator to yield mock URLs
    url_generator = (url for url in mock_urls)
    monkeypatch.setattr(
        "app.services.photos.storage_service.generate_presigned_get_url",
        lambda object_name: next(url_generator)
    )

    completion_request = {
        "photos": [
            {
                "object_name": "photos/uuid-1.jpg",
                "original_filename": "photo1.jpg",
                "price": 10.0,
                "photographer_id": session_for_photo.photographer_id,
                "session_id": session_for_photo.id
            },
            {
                "object_name": "photos/uuid-2.png",
                "original_filename": "photo2.png",
                "price": 20.0,
                "photographer_id": session_for_photo.photographer_id,
                "session_id": session_for_photo.id
            }
        ]
    }

    response = photographer_client.post("/photos/complete-upload", json=completion_request)

    assert response.status_code == 201, response.text
    created_photos = response.json()
    assert len(created_photos) == 2
    assert created_photos[0]["filename"] == "photo1.jpg"
    assert created_photos[1]["filename"] == "photo2.png"
    assert created_photos[0]["url"] == mock_urls[0]
    assert created_photos[1]["url"] == mock_urls[1]