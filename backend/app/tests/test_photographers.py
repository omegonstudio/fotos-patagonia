# -*- coding: utf-8 -*-
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

# Import models
from models.photographer import Photographer
from models.earning import Earning
from models.order import Order, OrderItem, PaymentStatus, OrderStatus, PaymentMethod
from models.photo import Photo
from models.user import User

# --- Fixtures for Earnings Tests ---

@pytest.fixture(scope="function")
def photographer_with_earnings(db_session: Session, user_factory) -> Photographer:
    """
    Creates a photographer with several earning records spread across different dates.
    This setup is complex because earnings depend on a full order/item/photo chain.
    """
    # 1. Create the Photographer User and Profile
    photographer_user = user_factory("Photographer", "earnings.photographer@test.com")
    photographer = photographer_user.photographer
    photographer.commission_percentage = 25.0 # 25% commission
    db_session.flush()

    # 2. Create a customer
    customer_user = user_factory("Customer", "earnings.customer@test.com")

    # 3. Create a Photo
    photo = Photo(
        photographer_id=photographer.id,
        price=100.0, # Base price of 100 for easy math
        filename="earnings/photo.jpg", # Use filename instead of object_name
        url="http://example.com/earnings/photo.jpg",
        watermark_url="http://example.com/earnings/photo-watermark.jpg",
        description="Photo for earnings test"
    )
    db_session.add(photo)
    db_session.flush()
    db_session.refresh(photo)

    # 4. Create Orders and Earnings at different times
    now = datetime.now(timezone.utc)
    dates = [now - timedelta(days=10), now - timedelta(days=5), now]
    
    for i, date in enumerate(dates):
        order = Order(
            user_id=customer_user.id,
            total=100.0,
            payment_method=PaymentMethod.MP,
            payment_status=PaymentStatus.PAID,
            order_status=OrderStatus.COMPLETED,
        )
        db_session.add(order)
        db_session.flush()
        db_session.refresh(order)

        order_item = OrderItem(
            order_id=order.id,
            photo_id=photo.id,
            quantity=1,
            price=100.0
        )
        db_session.add(order_item)
        db_session.flush()
        db_session.refresh(order_item)

        # Manually create the earning as if the service ran
        earning = Earning(
            photographer_id=photographer.id,
            order_item_id=order_item.id,
            order_id=order.id, # Ensure order_id is set
            amount=75.0, # 100 * (1 - 0.25)
            commission_applied=25.0,
            earned_photo_fraction=0.75, # 1 * (1 - 0.25)
            created_at=date
        )
        db_session.add(earning)
        db_session.flush()
        db_session.refresh(earning)
        
    db_session.refresh(photographer)
    return photographer

# --- Earnings API Tests ---

def test_photographer_can_get_own_earnings(photographer_client: TestClient, photographer_with_earnings: Photographer):
    """A photographer should be able to access their own earnings."""
    # The client is authenticated as 'photographer@test.com', but the earnings belong to 'earnings.photographer@test.com'.
    # We need to fetch the correct photographer ID from the fixture.
    photographer_id = photographer_with_earnings.id
    
    # To test this properly, we need to be authenticated as the *correct* photographer.
    # We'll log in as the user created in the fixture.
    from conftest import get_auth_headers
    photographer_user = photographer_with_earnings.user
    photographer_client.headers = get_auth_headers(photographer_client, photographer_user.email)

    response = photographer_client.get(f"/photographers/{photographer_id}/earnings")
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 3
    assert data[0]["amount"] == 75.0

def test_photographer_cannot_get_other_earnings(photographer_client: TestClient, photographer_with_earnings: Photographer):
    """A photographer should NOT be able to access another's earnings."""
    # The client is authenticated as 'photographer@test.com' by default.
    # The earnings belong to 'earnings.photographer@test.com' (ID from fixture).
    # This request should be forbidden.
    other_photographer_id = photographer_with_earnings.id
    response = photographer_client.get(f"/photographers/{other_photographer_id}/earnings")
    assert response.status_code == 403, response.text

def test_supervisor_can_get_any_earnings(supervisor_client: TestClient, photographer_with_earnings: Photographer):
    """A supervisor should be able to access any photographer's earnings."""
    photographer_id = photographer_with_earnings.id
    response = supervisor_client.get(f"/photographers/{photographer_id}/earnings")
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 3

def test_get_earnings_with_date_filter(supervisor_client: TestClient, photographer_with_earnings: Photographer):
    """Test filtering earnings by start_date and end_date."""
    photographer_id = photographer_with_earnings.id
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=7)).date().isoformat() # Should include 2 earnings
    end_date = (now + timedelta(days=1)).date().isoformat()

    url = f"/photographers/{photographer_id}/earnings?start_date={start_date}&end_date={end_date}"
    response = supervisor_client.get(url)
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 2

    # Test only start_date
    start_date = (now - timedelta(days=2)).date().isoformat() # Should include 1 earning
    url = f"/photographers/{photographer_id}/earnings?start_date={start_date}"
    response = supervisor_client.get(url)
    assert response.status_code == 200, response.text
    assert len(response.json()) == 1

# --- Earnings Summary API Tests ---

def test_get_earnings_summary(supervisor_client: TestClient, photographer_with_earnings: Photographer):
    """Test the earnings summary endpoint for correct calculation."""
    photographer_id = photographer_with_earnings.id
    response = supervisor_client.get(f"/photographers/{photographer_id}/earnings/summary")
    
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["photographer_id"] == photographer_id
    assert summary["total_earnings"] == pytest.approx(75.0 * 3)
    assert summary["total_orders_involved"] == 3
    assert summary["start_date"] is None # No filter applied
    assert summary["end_date"] is None

def test_get_earnings_summary_with_date_filter(supervisor_client: TestClient, photographer_with_earnings: Photographer):
    """Test the earnings summary endpoint with date filtering."""
    photographer_id = photographer_with_earnings.id
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=7)).date().isoformat() # Includes 2 earnings
    
    url = f"/photographers/{photographer_id}/earnings/summary?start_date={start_date}"
    response = supervisor_client.get(url)
    
    assert response.status_code == 200, response.text
    summary = response.json()
    assert summary["photographer_id"] == photographer_id
    assert summary["total_earnings"] == pytest.approx(75.0 * 2)
    assert summary["total_orders_involved"] == 2
    assert summary["start_date"] == start_date

def test_summary_permission_denied(photographer_client: TestClient, photographer_with_earnings: Photographer):
    """A photographer cannot get another photographer's summary."""
    other_photographer_id = photographer_with_earnings.id
    response = photographer_client.get(f"/photographers/{other_photographer_id}/earnings/summary")
    assert response.status_code == 403, response.text

# --- Basic CRUD Tests (Refactored with Permissions) ---

def test_supervisor_can_create_photographer(supervisor_client: TestClient, user_factory, db_session: Session):
    """Supervisors should be able to create photographer profiles for existing users."""
    # Create a regular user who doesn't have a photographer profile yet
    user_without_profile = user_factory("Customer", "new.photographer@test.com")
    db_session.flush()
    db_session.refresh(user_without_profile)

    photographer_data = {
        "name": "New Photographer",
        "commission_percentage": 15,
        "contact_info": "new@test.com",
        "user_id": user_without_profile.id
    }
    response = supervisor_client.post("/photographers/", json=photographer_data)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "New Photographer"
    assert data["user_id"] == user_without_profile.id

def test_photographer_cannot_create_photographer(photographer_client: TestClient):
    """Photographers should not be able to create new photographer profiles."""
    photographer_data = {"name": "Another Photographer", "commission_percentage": 10, "contact_info": "another@test.com", "user_id": 999}
    response = photographer_client.post("/photographers/", json=photographer_data)
    assert response.status_code == 403, response.text

def test_supervisor_can_update_photographer(supervisor_client: TestClient, photographer_with_earnings: Photographer):
    """Supervisors should be able to update any photographer."""
    photographer_id = photographer_with_earnings.id
    update_data = {"name": photographer_with_earnings.name, "commission_percentage": 50.0}
    
    response = supervisor_client.put(f"/photographers/{photographer_id}", json=update_data)
    assert response.status_code == 200, response.text
    assert response.json()["commission_percentage"] == 50.0