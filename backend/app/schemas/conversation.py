from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: str  # 'user' | 'assistant'
    content: str
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class ConversationHeader(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0
    last_message: Optional[str] = None


class ConversationDetail(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessage] = Field(default_factory=list)


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: str


class ConversationRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)
    current_profile: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ConversationResponse(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    is_fresh_profile: bool = False
    next_action: str = "ask_followup"  # 'ask_followup' | 'ready_for_results' | 'clarify'
    audio_base64: Optional[str] = None
    matched_schemes_count: Optional[int] = None
    total_discovered: Optional[int] = None
    top_schemes: Optional[List[Dict[str, Any]]] = None
    debug_trace: Optional[Dict[str, Any]] = None
