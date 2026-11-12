from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from app.services.speech_service import speech_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/voice", tags=["Voice System"])


class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = "female"


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text = await speech_service.transcribe(audio_bytes, file.content_type or "audio/wav")
    return {
        "text": text,
        "language": "hi",
        "provider": "bhashini_or_whisper_fallback"
    }


@router.post("/speak")
async def speak_text(req: SpeakRequest):
    audio_base64 = await tts_service.synthesize(req.text, req.voice or "female")
    return {
        "text": req.text,
        "audio_base64": audio_base64,
        "use_browser_synthesis": audio_base64 is None
    }

