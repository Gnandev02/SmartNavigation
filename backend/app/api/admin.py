from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .deps import get_current_active_user
from ..models.user import User
from ..db.session import get_db

router = APIRouter()

@router.get("/metrics")
def get_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        return {"error": "Not authorized"}
        
    users_count = db.query(User).count()
    return {
        "total_users": users_count,
        "active_vision_sessions": 12, # mock value
        "recent_sos_alerts": 3 # mock value
    }
