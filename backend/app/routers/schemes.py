from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.database import (
    get_all_schemes,
    get_scheme_by_id,
    get_current_profile,
    get_session_profile,
    get_user_profile,
    get_user_saved_schemes,
    get_user_saved_scheme_ids,
    save_user_scheme,
    remove_user_saved_scheme,
    is_scheme_saved,
)
from app.services.discovery_service import discovery_service
from app.auth_deps import get_optional_user, get_current_user, AuthenticatedUser

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


class DiscoverRequest(BaseModel):
    profile: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    category: Optional[str] = None
    search_query: Optional[str] = None
    government_level: Optional[str] = None  # 'central' | 'state' | None
    limit: Optional[int] = 100
    offset: Optional[int] = 0


@router.get("/categories")
def get_categories():
    """
    Returns the official 15 myScheme thematic categories with scheme counts.
    """
    return discovery_service.get_categories()


# =====================================================================
# SAVED SCHEMES (USER-ISOLATED)
# =====================================================================

@router.get("/saved")
def list_saved_schemes(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Returns schemes saved personally by the authenticated user.
    New users start with an empty list [].
    Never returns demo saved schemes.
    """
    if not user:
        return []
    return get_user_saved_schemes(user.id)


@router.get("/saved/ids")
def list_saved_scheme_ids(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Returns list of scheme IDs saved by the authenticated user.
    """
    if not user:
        return []
    return get_user_saved_scheme_ids(user.id)


@router.post("/saved/{scheme_id}")
def bookmark_scheme(scheme_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    """
    Saves a scheme to the user's personal saved list.
    """
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")
    success = save_user_scheme(user.id, scheme_id)
    if not success:
        raise HTTPException(status_code=400, detail="योजना सहेजने में विफल")
    return {
        "status": "success",
        "message": f"योजना '{scheme.get('scheme_name_hindi', scheme_id)}' सफलतापूर्वक सहेजी गई",
        "scheme_id": scheme_id,
        "is_saved": True
    }


@router.delete("/saved/{scheme_id}")
def unbookmark_scheme(scheme_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    """
    Removes a scheme from the user's personal saved list.
    Does NOT delete the scheme from the public catalog.
    """
    success = remove_user_saved_scheme(user.id, scheme_id)
    return {
        "status": "success",
        "message": "योजना सहेजी गई सूची से हटा दी गई",
        "scheme_id": scheme_id,
        "is_saved": False
    }


@router.post("/discover")
def discover_schemes(
    req: DiscoverRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    Intelligent multi-criteria discovery of verified Central & State government schemes.
    Runs the deterministic Python Rule Engine to evaluate eligibility.
    Uses user-specific profile when authenticated; never pollutes with other users' data.
    """
    # 1. Resolve Profile:
    # Priority A: Profile passed explicitly in request body
    # Priority B: Session profile from active conversation/session
    # Priority C: Authenticated user's own profile from database
    # Priority D: Fallback to active demo/default profile
    if req.profile:
        profile = req.profile
    elif req.session_id and get_session_profile(req.session_id):
        profile = get_session_profile(req.session_id)
    elif user:
        user_prof = get_user_profile(user.id)
        if user_prof and user_prof.get("is_onboarded"):
            profile = user_prof
        elif user_prof:
            # Partially onboarded
            profile = user_prof
        else:
            profile = {"id": user.id, "state": None, "is_onboarded": False}
    else:
        profile = get_current_profile()

    discovery_result = discovery_service.discover_schemes(
        profile=profile,
        category=req.category,
        search_query=req.search_query,
        government_level=req.government_level,
        limit=req.limit or 100,
        offset=req.offset or 0
    )

    # Attach is_saved flag for authenticated user
    if user:
        user_saved = set(get_user_saved_scheme_ids(user.id))
        for group in ["eligible", "potentially_eligible", "more_info_required", "not_eligible"]:
            for item in discovery_result.get("results", {}).get(group, []):
                item["is_saved"] = item.get("scheme_id") in user_saved

    return discovery_result


@router.get("")
def list_schemes(
    state: Optional[str] = None,
    category: Optional[str] = None,
    query: Optional[str] = None,
    level: Optional[str] = None
):
    all_schemes = get_all_schemes()
    filtered = []
    q = (query or "").strip().lower()

    for s in all_schemes:
        if not s.get("is_active", True):
            continue

        if state:
            states = s.get("applicable_states", [])
            if "All" not in states and state not in states:
                continue

        if category and category != "all" and s.get("category") != category:
            continue

        if level and s.get("central_or_state") != level:
            continue

        if q:
            searchable = " ".join([
                s.get("scheme_name", ""),
                s.get("scheme_name_hindi", ""),
                s.get("description", ""),
                s.get("description_hindi", ""),
                s.get("department_hindi", ""),
                s.get("category_hindi", ""),
                " ".join(s.get("beneficiary_tags", []))
            ]).lower()
            if q not in searchable:
                continue

        filtered.append(s)

    return filtered


@router.get("/{scheme_id}")
def get_scheme(scheme_id: str):
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली")
    return scheme
