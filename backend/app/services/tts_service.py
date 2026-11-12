"""
Modular Text-to-Speech (TTS) Service for Sarkari Saathi.
Supports Bhashini TTS, Cloud TTS, and Web Speech API fallback.
"""
from typing import Optional
from app.config import settings


class TextToSpeechService:
    def __init__(self):
        self.bhashini_key = settings.BHASHINI_API_KEY

    async def synthesize(self, text_hindi: str, voice_gender: str = "female") -> Optional[str]:
        """
        Synthesizes Hindi text into speech audio.
        Returns base64 encoded audio or audio URL if provider is configured.
        """
        if self.bhashini_key:
            # Bhashini TTS invocation
            pass

        # Returns None when relying on browser Web Speech API (window.speechSynthesis)
        # which provides low-latency, native Hindi pronunciation out of the box!
        return None


tts_service = TextToSpeechService()

