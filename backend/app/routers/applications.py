from fastapi import APIRouter, Depends
from typing import List, Optional
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.database import get_user_applications, add_user_application, get_scheme_by_id
from app.auth_deps import get_optional_user, AuthenticatedUser

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationResponse])
def list_applications(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    return get_user_applications(user_id=user_id)


@router.post("", response_model=ApplicationResponse)
def submit_application(payload: ApplicationCreate, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    user_id = user.id if user else None
    scheme = get_scheme_by_id(payload.scheme_id) or {}
    record = {
        "scheme_id": payload.scheme_id,
        "scheme_name_hindi": scheme.get("scheme_name_hindi", "सरकारी योजना"),
        "department_hindi": scheme.get("department_hindi", "संबंधित विभाग"),
        "application_status": "submitted_at_csc",
        "application_reference": payload.application_reference,
        "official_website": scheme.get("official_website", "https://india.gov.in")
    }
    return add_user_application(record, user_id=user_id)
