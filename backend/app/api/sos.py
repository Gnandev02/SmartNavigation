from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from .deps import get_current_active_user
from ..models.user import User
from ..db.session import get_db
from ..models.history import History
from ..schemas.history import HistoryResponse
from .ws import manager
import asyncio

router = APIRouter()

class SOSRequest(BaseModel):
    latitude: float
    longitude: float

@router.post("/", response_model=HistoryResponse)
def trigger_sos(
    sos_data: SOSRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Log SOS event
    description = f"SOS triggered at lat: {sos_data.latitude}, lon: {sos_data.longitude}"
    history = History(user_id=current_user.id, event_type="sos", description=description)
    db.add(history)
    db.commit()
    db.refresh(history)
    
    # Broadcast to connected dashboard users (e.g. admins)
    asyncio.create_task(manager.broadcast_to_user("test@test.com", {"type": "sos", "data": description}))
    
    return history

@router.get("/history", response_model=List[HistoryResponse])
def get_sos_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Admins might need to see all, but for now just returning user's own history
    events = db.query(History).filter(History.user_id == current_user.id, History.event_type == "sos").order_by(History.timestamp.desc()).all()
    return events
