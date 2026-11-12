from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.document_service import document_service
from app.schemas.document import DocumentChecklistResponse
from app.auth_deps import get_optional_user, AuthenticatedUser

router = APIRouter(prefix="/documents", tags=["Document Checklist"])


class DocumentStatusUpdate(BaseModel):
    document_name: str
    status: str  # 'available' | 'missing' | 'uploaded'


@router.get("/checklist/{scheme_id}", response_model=DocumentChecklistResponse)
def get_checklist(scheme_id: str, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    res = document_service.get_checklist_for_scheme(scheme_id, user_id=user_id)
    if not res:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली")
    return res


@router.put("/status")
def update_status(payload: DocumentStatusUpdate, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    document_service.update_document(payload.document_name, payload.status, user_id=user_id)
    return {
        "status": "success",
        "message": f"'{payload.document_name}' की स्थिति '{payload.status}' में अपडेट की गई",
        "document_name": payload.document_name,
        "new_status": payload.status
    }
