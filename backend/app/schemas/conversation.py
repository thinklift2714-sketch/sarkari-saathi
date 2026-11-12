from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str
    audio_url: Optional[str] = None
    created_at: Optional[str] = None


class ConversationRequest(BaseModel):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    current_profile: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ConversationResponse(BaseModel):
    message: str
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    next_action: str = "ask_followup"  # 'ask_followup' | 'ready_for_results' | 'clarify'
    audio_base64: Optional[str] = None
    matched_schemes_count: Optional[int] = None
    total_discovered: Optional[int] = None
    top_schemes: Optional[List[Dict[str, Any]]] = None
