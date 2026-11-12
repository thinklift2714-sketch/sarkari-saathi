from typing import Optional
from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    scheme_id: str
    application_reference: Optional[str] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    scheme_id: str
    scheme_name_hindi: str
    department_hindi: str
    application_status: str  # 'draft', 'submitted_at_csc', 'in_review', 'approved'
    application_reference: Optional[str] = None
    applied_date: str
    official_website: str

