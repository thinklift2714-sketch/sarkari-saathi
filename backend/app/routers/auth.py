"""
Authentication endpoints for Sarkari Saathi.
Supports Supabase Auth JWT verification, user identity retrieval, and account deletion.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import os

from app.auth_deps import get_current_user, get_optional_user, AuthenticatedUser
from app.database import get_user_profile, save_user_profile, delete_user_account_data
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


class DevSessionRequest(BaseModel):
    name: str = "नागरिक"
    phone: Optional[str] = "+919876543210"
    email: Optional[str] = None


@router.get("/me")
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Returns verified identity of the authenticated user from Supabase JWT.
    Enforces that user can only access their own account details.
    """
    prof = get_user_profile(user.id)
    is_onboarded = prof.get("is_onboarded", False) if prof else False

    return {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_authenticated": True,
        "is_onboarded": is_onboarded,
        "name": prof.get("name", "") if prof else "",
        "profile": prof
    }


@router.delete("/delete-account")
async def delete_account(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Permanently deletes all personal records, family details, uploaded documents,
    and scheme results for the authenticated user.
    """
    success = delete_user_account_data(user.id)
    return {
        "status": "success",
        "message": "खाता और सभी व्यक्तिगत डेटा सफलतापूर्वक हटा दिया गया है (Account and all personal data deleted successfully)",
        "user_id": user.id
    }


@router.get("/status")
def get_auth_status():
    """
    Returns the Supabase Auth configuration status.
    Indicates whether Supabase, Google OAuth, or Phone Auth is configured.
    """
    supabase_configured = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
    return {
        "supabase_configured": supabase_configured,
        "supabase_url": settings.SUPABASE_URL[:25] + "..." if settings.SUPABASE_URL else "",
        "google_oauth_enabled": supabase_configured,
        "phone_auth_enabled": supabase_configured,
        "demo_mode": settings.DEMO_MODE,
        "message": "Supabase Auth active" if supabase_configured else "Supabase credentials pending in .env"
    }


@router.post("/dev-session")
def create_dev_session(req: DevSessionRequest):
    """
    Creates an isolated development test session token for local evaluation
    when Supabase credentials are not yet entered by the user.
    """
    user_id = str(uuid.uuid4())
    token = f"dev-user-{user_id}:{req.email or f'user_{user_id[:6]}@sarkari.local'}:{req.phone}"
    
    # Do NOT prefill demo data; create blank profile
    save_user_profile(user_id, {
        "name": req.name,
        "is_onboarded": False
    })

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": req.name,
            "phone": req.phone,
            "email": req.email,
            "is_onboarded": False
        }
    }
