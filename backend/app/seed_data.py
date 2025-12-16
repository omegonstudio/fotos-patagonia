# backend/app/seed_data.py

import logging
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Import project components, mirroring initial_data.py
from db.session import SessionLocal, engine
from db.base import Base
from models.user import User, UserCreateSchema
from models.role import Role
from models.permission import Permission
from models.photographer import Photographer
from models.album import Album
from models.photo_session import PhotoSession
from models.photo import Photo
from models.order import Order, OrderItem, PaymentMethod, PaymentStatus, OrderStatus
from services.users import UserService
from services.orders import OrderService
from core.permissions import Permissions
from core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Constants ---
NUM_PHOTOGRAPHERS = 3
TOTAL_ORDERS = 250
ALBUMS_PER_PHOTOGRAPHER = 4
SESSIONS_PER_ALBUM = 3
PHOTOS_PER_SESSION = 25
MAX_ITEMS_PER_ORDER = 4

def seed_data(db: Session) -> None:
    """
    Main function to seed the database with test data.
    """
    logger.info("--- Starting data seeding ---")

    # --- 1. Fetch Roles and Permissions (assuming initial_data.py has run) ---
    logger.info("Fetching existing Roles and Permissions...")
    all_perms_map = {p.name: p for p in db.query(Permission).all()} # Need to load existing permissions

    # --- 2. Create Users (Photographers) ---
    logger.info(f"Creating {NUM_PHOTOGRAPHERS} photographers...")
    user_service = UserService(db)
    photographer_role_id = db.query(Role).filter(Role.name == "Photographer").one().id    
    photographers = []
    for i in range(NUM_PHOTOGRAPHERS):
        user_in = UserCreateSchema(
            email=f"photographer_{i+1}@example.com",
            password=f"password{i+1}",
            role_id=photographer_role_id
        )
        user = user_service.create_user(user_in)
        photographer = Photographer(
            user_id=user.id,
            name=f"Fotógrafo {i+1}",
            commission_percentage=round(random.uniform(15.0, 30.0), 2),
            contact_info=f"contact_{i+1}@example.com" # Added contact_info
        )
        db.add(photographer)
        db.commit()
        db.refresh(photographer)
        photographers.append(photographer)

    # --- 3. Create Photography Data (Albums, Sessions, Photos) ---
    logger.info("Creating Albums, Sessions, and Photos...")
    all_photos = []
    for photographer in photographers:
        for i in range(ALBUMS_PER_PHOTOGRAPHER):
            album = Album(name=f"Álbum {i+1} de {photographer.name}", description="Fotos de eventos variados.")
            db.add(album)
            db.commit()
            db.refresh(album)

            for j in range(SESSIONS_PER_ALBUM):
                session_date = datetime.now() - timedelta(days=random.randint(5, 365))
                session = PhotoSession(
                    album_id=album.id,
                    photographer_id=photographer.id,
                    event_name=f"Sesión {j+1} - {album.name}",
                    event_date=session_date,
                    location=f"Lugar del evento {j+1}"
                )
                db.add(session)
                db.commit()
                db.refresh(session)

                for k in range(PHOTOS_PER_SESSION):
                    photo = Photo(
                        session_id=session.id,
                        photographer_id=photographer.id,
                        filename=f"photo_{photographer.id}_{session.id}_{k+1}.jpg",
                        url=f"https://example.com/photos/photo_{photographer.id}_{session.id}_{k+1}.jpg",
                        watermark_url=f"https://example.com/watermarks/photo_{photographer.id}_{session.id}_{k+1}.jpg",
                        price=round(random.uniform(5.0, 50.0), 2)
                    )
                    all_photos.append(photo)

    db.add_all(all_photos)
    db.commit()
    logger.info(f"Created a total of {len(all_photos)} photos.")

    # --- 4. Create Orders and Earnings ---
    logger.info(f"Creating {TOTAL_ORDERS} orders and processing earnings...")
    order_service = OrderService(db)
    orders_created = 0
    for _ in range(TOTAL_ORDERS):
        num_items = random.randint(1, MAX_ITEMS_PER_ORDER)
        order_items_to_create = []
        order_total = 0.0

        if not all_photos:
            logger.warning("No photos available to create orders.")
            break
        
        selected_photos = random.sample(all_photos, min(num_items, len(all_photos)))

        for photo in selected_photos:
            item = OrderItem(photo_id=photo.id, price=photo.price, quantity=1)
            order_items_to_create.append(item)
            order_total += photo.price
        
        is_paid = random.random() < 0.8
        payment_status = PaymentStatus.PAID if is_paid else PaymentStatus.PENDING
        order_status = OrderStatus.PAID if is_paid else OrderStatus.PENDING
        payment_method = random.choice(list(PaymentMethod))

        order = Order(
            user_id=None,
            total=round(order_total, 2),
            payment_method=payment_method,
            payment_status=payment_status,
            order_status=order_status,
            items=order_items_to_create
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        orders_created += 1
        
        if is_paid:
            order_service.process_earnings_for_order(order)
            db.commit()

    logger.info(f"Created a total of {orders_created} orders.")

def main() -> None:
    logger.info("Starting database seeding process.")
    try:
        logger.info("Ensuring all tables exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables verified/created successfully.")

        db = SessionLocal()
        seed_data(db)
        db.close()
        logger.info("Database seeding finished successfully.")
    except Exception as e:
        logger.error(f"An error occurred during database seeding: {e}")
        raise e

if __name__ == "__main__":
    main()
