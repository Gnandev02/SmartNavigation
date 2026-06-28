import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from ..core.config import settings

router = APIRouter()

client = OpenAI(api_key=settings.OPENAI_API_KEY)

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        with open(temp_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
            
            # Extract text and detected language
            text = transcript.text
            language = getattr(transcript, 'language', 'en')
            
            return {"text": text, "language": language}
            
    except Exception as e:
        print(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
