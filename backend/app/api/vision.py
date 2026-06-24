from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from .deps import get_current_active_user
from ..models.user import User
from ..db.session import get_db
from ..models.history import History
from ..ai.object_detection import detect_objects
from ..ai.ocr import read_text_from_image

router = APIRouter()

@router.post("/detect")
async def detect_vision(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        detected_objects = detect_objects(contents)
        
        # Log to history
        description = f"Detected: {', '.join(detected_objects)}" if detected_objects else "No objects detected"
        history = History(user_id=current_user.id, event_type="detection", description=description)
        db.add(history)
        db.commit()
        
        return {"objects": detected_objects, "message": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read-text")
async def read_text(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        text = read_text_from_image(contents)
        
        # Log to history
        description = f"Read text: {text}" if text else "No text found"
        history = History(user_id=current_user.id, event_type="ocr", description=description)
        db.add(history)
        db.commit()
        
        return {"text": text, "message": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
