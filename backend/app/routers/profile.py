from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict, Optional
from app.schemas.profile import ProfileResponse, ProfileUpdate, FamilyMember
from app.auth_deps import get_optional_user, get_current_user, AuthenticatedUser
from app.database import (
    get_current_profile,
    update_profile,
    add_family_member,
    remove_family_member,
    get_user_profile,
    save_user_profile,
    add_user_family_member,
    remove_user_family_member,
    get_user_family_members
)

router = APIRouter(prefix="/profile", tags=["Profile Management"])


@router.get("", response_model=ProfileResponse)
def get_profile(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Retrieves the profile of the current user.
    If authenticated, returns ONLY that user's personal profile (empty if not yet onboarded).
    """
    if user:
        prof = get_user_profile(user.id)
        if not prof:
            return ProfileResponse(
                id=user.id,
                user_id=user.id,
                name="",
                is_onboarded=False,
                members=[]
            )
        return prof
    return get_current_profile()


@router.post("", response_model=ProfileResponse)
@router.put("", response_model=ProfileResponse)
def save_profile(updates: ProfileUpdate, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Saves or updates profile for the authenticated user.
    Never overwrites or contaminates another user's profile.
    """
    data = updates.model_dump(exclude_unset=True)
    if user:
        return save_user_profile(user.id, data)
    return update_profile(data)


@router.post("/members")
def add_member(member: FamilyMember, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Adds a family member for the authenticated user.
    """
    if user:
        created = add_user_family_member(user.id, member.model_dump())
    else:
        created = add_family_member(member.model_dump())
    return {
        "status": "success",
        "message": f"सदस्य {member.name} सफलतापूर्वक जोड़ा गया",
        "member": created
    }


@router.delete("/members/{member_id}")
def delete_member(member_id: str, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Deletes a family member belonging to the current user.
    """
    if user:
        success = remove_user_family_member(user.id, member_id)
    else:
        success = remove_family_member(member_id)

    if not success:
        raise HTTPException(status_code=404, detail="सदस्य नहीं मिला")
    return {
        "status": "success",
        "message": "सदस्य हटा दिया गया"
    }
