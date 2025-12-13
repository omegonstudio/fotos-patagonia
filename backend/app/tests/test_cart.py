import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

# Import models
from models.photographer import Photographer
from models.album import Album
from models.photo_session import PhotoSession
from models.photo import Photo

# --- Fixtures for Cart Test Setup ---

@pytest.fixture(scope="function")
def photographer_for_cart(db_session: Session, user_factory) -> Photographer:
    """Creates a photographer user and profile for cart tests."""
    user = user_factory("Photographer", "photographer.cart@test.com")
    db_session.flush()
    db_session.refresh(user)
    return user.photographer

@pytest.fixture(scope="function")
def photo_for_cart(db_session: Session, photographer_for_cart: Photographer, monkeypatch) -> Photo:
    """Creates a complete photo entity for use in cart tests."""
    # Mock the storage service to avoid actual S3 calls
    mock_get_url = "http://minio:9000/fotopatagonia/mocked_cart_photo.jpg"
    monkeypatch.setattr(
        "app.services.storage.StorageService.generate_presigned_get_url",
        lambda self, object_name: mock_get_url
    )

    album = Album(
        name="Test Album Cart",
        description="An album for cart tests"
    )
    db_session.add(album)

    photo_session = PhotoSession(
        event_name="Test Session Cart",
        event_date=datetime.now(timezone.utc),
        location="Test Location Cart",
        photographer_id=photographer_for_cart.id,
        album_id=album.id
    )
    db_session.add(photo_session)
    db_session.flush()
    db_session.refresh(album)
    db_session.refresh(photo_session)

    photo = Photo(
        filename="test_photo_cart.jpg",
        description="Test Photo Cart",
        price=10.0,
        url="http://example.com/photos/cart-test-photo.jpg",
        watermark_url="http://example.com/photos/cart-test-photo-watermark.jpg",
        photographer_id=photographer_for_cart.id,
        session_id=photo_session.id
    )
    db_session.add(photo)
    db_session.flush()
    db_session.refresh(photo)
    return photo

# --- Cart API Tests ---

def test_add_item_to_cart(customer_client: TestClient, photo_for_cart: Photo):
    """A customer can add a photo to their cart."""
    item_data = {"photo_id": photo_for_cart.id, "quantity": 1}
    response = customer_client.post("/cart/items", json=item_data)
    
    assert response.status_code == 200, response.text
    cart = response.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["photo"]["id"] == photo_for_cart.id
    assert cart["total"] == photo_for_cart.price

def test_update_cart_item(customer_client: TestClient, photo_for_cart: Photo):
    """A customer can update the quantity of an item in their cart."""
    # Add item first
    item_data = {"photo_id": photo_for_cart.id, "quantity": 1}
    customer_client.post("/cart/items", json=item_data)

    # Get the cart to find the item's ID
    response = customer_client.get("/cart/")
    cart = response.json()
    item_id = cart["items"][0]["id"]

    # Update the quantity
    update_data = {"quantity": 5}
    response = customer_client.put(f"/cart/items/{item_id}", json=update_data)
    
    assert response.status_code == 200, response.text
    cart = response.json()
    assert cart["items"][0]["quantity"] == 5
    assert cart["total"] == photo_for_cart.price * 5

def test_delete_cart_item(customer_client: TestClient, photo_for_cart: Photo):
    """A customer can delete an item from their cart."""
    # Add item first
    item_data = {"photo_id": photo_for_cart.id, "quantity": 1}
    customer_client.post("/cart/items", json=item_data)

    # Get the cart to find the item's ID
    response = customer_client.get("/cart/")
    cart = response.json()
    item_id = cart["items"][0]["id"]

    # Delete the item
    response = customer_client.delete(f"/cart/items/{item_id}")
    
    assert response.status_code == 200, response.text
    cart = response.json()
    assert len(cart["items"]) == 0
    assert cart["total"] == 0

def test_empty_cart(customer_client: TestClient, photo_for_cart: Photo):
    """A customer can empty their entire cart."""
    # Add an item first
    item_data = {"photo_id": photo_for_cart.id, "quantity": 1}
    customer_client.post("/cart/items", json=item_data)

    # Empty the cart
    response = customer_client.delete("/cart/")
    
    assert response.status_code == 200, response.text
    cart = response.json()
    assert len(cart["items"]) == 0
    assert cart["total"] == 0