from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentChecklistItem(BaseModel):
    id: str
    document_name: str
    document_name_hindi: str
    is_required: bool = True
    status: str = "missing"  # 'available' | 'missing' | 'uploaded'
    instructions: Optional[str] = None
    how_to_get: Optional[str] = None


class DocumentChecklistResponse(BaseModel):
    scheme_id: str
    scheme_name_hindi: str
    total_count: int
    completed_count: int
    progress_percentage: int
    items: List[DocumentChecklistItem] = Field(default_factory=list)


class UpdateDocumentStatusRequest(BaseModel):
    status: str  # 'available' | 'missing' | 'uploaded'

