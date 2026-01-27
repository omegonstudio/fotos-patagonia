import asyncio
from sqlalchemy.orm import Session, joinedload
from db.session import SessionLocal
from models.user import User
from models.photo import Photo
from models.order import Order, OrderItem
from models.earning import Earning
from services.orders import process_earnings_for_order_item

async def update_photos_and_recalculate_earnings():
    """
    Assigns all photos in existing orders to a specific photographer and recalculates earnings.
    """
    db: Session = SessionLocal()
    try:
        # 1. Find the photographer by email
        photographer_user = db.query(User).options(joinedload(User.photographer)).filter(User.email == "adrian@foto.com").first()
        if not photographer_user or not photographer_user.photographer:
            print("Error: Photographer with email adrian@foto.com not found.")
            return

        new_photographer_id = photographer_user.photographer.id
        print(f"Found photographer: {photographer_user.email} with photographer ID: {new_photographer_id}")

        # 2. Get all unique photos from all orders
        photos_in_orders_query = db.query(Photo).join(OrderItem, OrderItem.photo_id == Photo.id).distinct()
        photos_to_update = photos_in_orders_query.all()
        
        if not photos_to_update:
            print("No photos found in existing orders. Nothing to do.")
            return

        print(f"Found {len(photos_to_update)} unique photos in orders to update.")

        # 3. Update photographer_id for each photo
        for photo in photos_to_update:
            if photo.photographer_id != new_photographer_id:
                print(f"Updating Photo ID {photo.id}: Old photographer_id={photo.photographer_id}, New={new_photographer_id}")
                photo.photographer_id = new_photographer_id
        
        # Commit photo ownership changes
        db.commit()
        print("All photo ownership updated successfully.")

        # 4. Recalculate earnings
        print("Starting earnings recalculation...")
        
        # Delete all existing earnings
        num_deleted = db.query(Earning).delete()
        db.commit()
        print(f"Deleted {num_deleted} old earning entries.")

        # Get all order items to create new earnings
        all_order_items = db.query(OrderItem).options(joinedload(OrderItem.photo).joinedload(Photo.photographer)).all()
        
        for item in all_order_items:
            # The photo on the item is now associated with the new photographer
            if item.photo and item.photo.photographer:
                 process_earnings_for_order_item(db, item)
                 print(f"Recalculated earning for OrderItem ID {item.id}")
            else:
                print(f"Skipping earning for OrderItem ID {item.id} - photo or photographer not found.")

        db.commit()
        print("Earnings recalculation completed successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    print("Running script to update photo owners and recalculate earnings...")
    asyncio.run(update_photos_and_recalculate_earnings())
    print("Script finished.")
