from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from deps import get_db, PermissionChecker
from models.photographer import Photographer
from models.album import Album
from models.photo_session import PhotoSession
from models.photo import Photo # Import Photo model
from core.permissions import Permissions
from models.user import User
from models.role import Role
from core.security import get_password_hash

router = APIRouter(
    prefix="/testing",
    tags=["testing"],
)

@router.post("/setup", status_code=status.HTTP_201_CREATED)
def setup_test_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker([Permissions.FULL_ACCESS]))
):
    """
    Creates the necessary prerequisite data for frontend testing if it doesn't exist.
    - Test Photographer (ID=1)
    - Test Album (ID=1) with a linked PhotoSession (ID=1)
    - Test Photo (ID=1) linked to the above.
    - Supervisor User (supervisor@example.com)
    - Photographer User (photographer@example.com) linked to a new Photographer entity.
    This endpoint is idempotent.
    """
    
    # --- Check/Create Generic Test Photographer, Album, Session, and Photo ---
    photographer = db.get(Photographer, 1)
    if not photographer:
        photographer = Photographer(id=1, name="Test Photographer", commission_percentage=10.0)
        db.add(photographer)

    album = db.get(Album, 1)
    if not album:
        album = Album(id=1, name="Test Album", description="Album for testing")
        db.add(album)

    session = db.get(PhotoSession, 1)
    if not session:
        session = PhotoSession(
            id=1, 
            event_name="Test Session", 
            event_date=datetime.utcnow(),
            location="Test Location",
            photographer_id=1, 
            album_id=1
        )
        db.add(session)
    
    photo = db.query(Photo).filter(Photo.filename == "test_photo.jpg").first()
    if not photo:
        photo = Photo(
            filename="test_photo.jpg",
            description="A beautiful test photo",
            price=150.0,
            url="https://via.placeholder.com/800x600.png?text=Test+Photo",
            watermark_url="https://via.placeholder.com/800x600.png?text=Test+Photo+Watermarked",
            photographer_id=1,
            session_id=1
        )
        db.add(photo)
        db.flush() # Ensure the photo object gets an ID before we return it

    # --- Create Test Users ---
    supervisor_role = db.query(Role).filter(Role.name == "Supervisor").first()
    photographer_role = db.query(Role).filter(Role.name == "Photographer").first()
    
    if not supervisor_role or not photographer_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Essential roles 'Supervisor' or 'Photographer' not found. Run initial data setup."
        )

    if not db.query(User).filter(User.email == "supervisor@example.com").first():
        supervisor_user = User(
            email="supervisor@example.com",
            hashed_password=get_password_hash("password"),
            is_active=True,
            role_id=supervisor_role.id
        )
        db.add(supervisor_user)

    if not db.query(User).filter(User.email == "photographer@example.com").first():
        photographer_user = User(
            email="photographer@example.com",
            hashed_password=get_password_hash("password"),
            is_active=True,
            role_id=photographer_role.id
        )
        db.add(photographer_user)
        db.flush() 

        new_photographer_entity = Photographer(
            name="Regular Photographer",
            commission_percentage=15.0,
            contact_info="photographer@example.com",
            user_id=photographer_user.id
        )
        db.add(new_photographer_entity)

    try:
        db.commit()
        return {
            "message": "Test data prepared successfully, including users and a test photo.",
            "test_photo_id": photo.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create test data: {e}"
        )
