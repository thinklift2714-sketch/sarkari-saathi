from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.database import get_all_schemes, get_scheme_by_id, get_current_profile
from app.services.discovery_service import discovery_service

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


class DiscoverRequest(BaseModel):
    profile: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    search_query: Optional[str] = None
    government_level: Optional[str] = None # 'central' | 'state' | None
    limit: Optional[int] = 100
    offset: Optional[int] = 0


@router.get("/categories")
def get_categories():
    """
    Returns the official 15 myScheme thematic categories with scheme counts.
    """
    return discovery_service.get_categories()


@router.post("/discover")
def discover_schemes(req: DiscoverRequest):
    """
    Intelligent multi-criteria discovery of verified Central & State government schemes.
    Runs the deterministic Python Rule Engine to evaluate eligibility.
    """
    profile = req.profile or get_current_profile()
    return discovery_service.discover_schemes(
        profile=profile,
        category=req.category,
        search_query=req.search_query,
        government_level=req.government_level,
        limit=req.limit or 100,
        offset=req.offset or 0
    )


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
