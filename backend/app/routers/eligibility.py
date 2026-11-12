from fastapi import APIRouter
from typing import Any, Dict, Optional
from app.services.eligibility_service import eligibility_service
from app.database import get_current_profile

router = APIRouter(prefix="/eligibility", tags=["Eligibility Rule Engine"])


@router.post("/evaluate")
@router.get("/results")
def evaluate_eligibility(custom_profile: Optional[Dict[str, Any]] = None):
    """
    Deterministically evaluates all government schemes against user profile.
    """
    profile = custom_profile or get_current_profile()
    return eligibility_service.evaluate_all_schemes(profile)

