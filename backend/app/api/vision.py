from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .deps import get_current_active_user
from ..models.user import User
from ..db.session import get_db
from ..models.history import History
from ..ai.object_detection import detect_objects
from ..ai.ocr import read_text_from_image
from ..ai.translations import translate

router = APIRouter()

@router.post("/detect")
async def detect_vision(
    file: UploadFile = File(...),
    lang: str = Query("en", description="Language for the detection response")
):
    try:
        contents = await file.read()
        detected_objects = detect_objects(contents, lang)
        
        # Translate description
        if detected_objects:
            prefix = translate("detected", lang)
            description = f"{prefix} {', '.join(detected_objects)}"
        else:
            description = translate("no_objects", lang)
            
        return {"objects": detected_objects, "message": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read-text")
async def read_text(
    file: UploadFile = File(...),
    lang: str = Query("en", description="Language for the OCR response")
):
    try:
        contents = await file.read()
        text = read_text_from_image(contents)
        
        if text:
            prefix = translate("read_text", lang)
            description = f"{prefix} {text}"
        else:
            description = translate("no_text", lang)
            
        return {"text": text, "message": description}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
