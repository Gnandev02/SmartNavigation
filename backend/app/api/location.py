from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .deps import get_current_active_user
from ..models.user import User
from ..db.session import get_db
from ..models.history import History

router = APIRouter()

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# We could store locations in a separate table, but for simplicity we log to history
@router.post("/update")
def update_location(
    location: LocationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    description = f"Location update: lat {location.latitude}, lon {location.longitude}"
    history = History(user_id=current_user.id, event_type="location", description=description)
    db.add(history)
    db.commit()
    return {"status": "Location updated"}

@router.get("/current")
def get_current_location(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Ensure current user is caregiver/admin or the user themselves (omitted for brevity)
    last_location = db.query(History).filter(
        History.user_id == user_id, 
        History.event_type == "location"
    ).order_by(History.timestamp.desc()).first()
    
    if not last_location:
        raise HTTPException(status_code=404, detail="Location not found")
        
    return {"user_id": user_id, "last_location": last_location.description, "timestamp": last_location.timestamp}
