from typing import List, Optional
from pydantic import BaseModel, Field


class DocumentChecklistItem(BaseModel):
    id: str
    document_name: str
    document_name_hindi: str
    is_required: bool = True
    is_mandatory: bool = True
    status: str = "missing"  # 'available' | 'missing' | 'uploaded'
    why_needed: Optional[str] = None
    why_needed_hindi: Optional[str] = None
    issuing_authority: Optional[str] = None
    issuing_authority_hindi: Optional[str] = None
    instructions: Optional[str] = None
    how_to_get: Optional[str] = None


class DocumentChecklistResponse(BaseModel):
    scheme_id: str
    scheme_name: Optional[str] = None
    scheme_name_hindi: str
    department: Optional[str] = None
    department_hindi: Optional[str] = None
    official_website: Optional[str] = None
    total_count: int
    completed_count: int
    progress_percentage: int
    items: List[DocumentChecklistItem] = Field(default_factory=list)


class UpdateDocumentStatusRequest(BaseModel):
    status: str  # 'available' | 'missing' | 'uploaded'
