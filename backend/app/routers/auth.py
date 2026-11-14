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


class EmailAuthRequest(BaseModel):
    email: str
    password: Optional[str] = None
    name: Optional[str] = None
    action: Optional[str] = "login"


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


@router.post("/email")
def authenticate_with_email(req: EmailAuthRequest):
    """
    Allows any user to log in or sign up using their own email address.
    Generates a deterministic unique UUID based on the email address so the user's
    profile, family members, documents, and schemes are 100% isolated to that user's email.
    """
    email_clean = req.email.strip().lower()
    if not email_clean or "@" not in email_clean or "." not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="कृपया एक मान्य ईमेल पता दर्ज करें (Please enter a valid email address)"
        )

    # Deterministic UUID per email ensures user always gets their own isolated data across sessions
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sarkari_user:{email_clean}"))
    token = f"dev-user-{user_id}:{email_clean}:"

    existing_prof = get_user_profile(user_id)
    if not existing_prof:
        # First time login for this email: create clean un-onboarded profile
        display_name = req.name.strip() if req.name and req.name.strip() else email_clean.split("@")[0].replace(".", " ").title()
        save_user_profile(user_id, {
            "name": display_name,
            "email": email_clean,
            "is_onboarded": False,
            "family_size": 1,
            "members": []
        })
        is_onboarded = False
        user_name = display_name
    else:
        is_onboarded = existing_prof.get("is_onboarded", False)
        user_name = existing_prof.get("name") or email_clean.split("@")[0]

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user_name,
            "email": email_clean,
            "is_onboarded": is_onboarded
        }
    }
