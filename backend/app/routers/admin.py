"""
Admin Scheme Management & Data Governance Router
================================================
Provides administrative control over the government schemes catalog:
- Add, edit, and deactivate schemes
- Update scheme-specific document requirements & application guides
- Verify official government source URLs and audit timestamps
- Review API synchronization logs, errors, and connector health
- Trigger manual synchronization across government data sources
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.schemas.scheme import SchemeCreate, SchemeUpdate, SchemeItem
from app.database import (
    get_all_schemes,
    get_scheme_by_id,
    add_scheme,
    update_scheme,
    delete_scheme,
    mark_scheme_verified,
    get_sync_audit_logs,
)
from app.integrations.connector_manager import connector_manager
from app.auth_deps import get_optional_user, AuthenticatedUser

router = APIRouter(prefix="/admin", tags=["Admin & Data Governance"])


class VerifyRequest(BaseModel):
    verifier_name: Optional[str] = "Admin"
    notes: Optional[str] = "Manually verified against official government portal / gazette."


@router.get("/schemes", response_model=List[Dict[str, Any]])
def admin_list_schemes(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    Returns full administrative view of all government schemes, including
    verification status, last verified timestamp, and data sources.
    """
    schemes = get_all_schemes()
    filtered = []
    q = (search or "").strip().lower()

    for s in schemes:
        if category and category != "all" and s.get("category") != category:
            continue
        if status and status != "all" and s.get("data_verification_status") != status:
            continue
        if q:
            searchable = " ".join([
                s.get("scheme_name", ""),
                s.get("scheme_name_hindi", ""),
                s.get("department_hindi", ""),
                s.get("official_website", ""),
            ]).lower()
            if q not in searchable:
                continue
        filtered.append(s)

    return filtered


@router.get("/schemes/{scheme_id}")
def admin_get_scheme(scheme_id: str):
    """
    Returns complete scheme record for admin editing.
    """
    scheme = get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")
    return scheme


@router.post("/schemes", status_code=201)
def admin_create_scheme(payload: SchemeCreate):
    """
    Adds a new verified government scheme to the centralized database.
    """
    data = payload.model_dump()
    created = add_scheme(data)
    return {
        "status": "success",
        "message": f"योजना '{created.get('scheme_name_hindi', created.get('scheme_name'))}' सफलतापूर्वक जोड़ी गई",
        "scheme": created
    }


@router.put("/schemes/{scheme_id}")
def admin_update_scheme(scheme_id: str, payload: SchemeUpdate):
    """
    Updates an existing scheme's eligibility, document checklist, application steps, or links.
    """
    existing = get_scheme_by_id(scheme_id)
    if not existing:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_scheme(scheme_id, updates)
    return {
        "status": "success",
        "message": "योजना की जानकारी सफलतापूर्वक अपडेट की गई",
        "scheme": updated
    }


@router.delete("/schemes/{scheme_id}")
def admin_delete_scheme(scheme_id: str):
    """
    Deactivates / deletes a scheme from the catalog.
    """
    existing = get_scheme_by_id(scheme_id)
    if not existing:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")

    success = delete_scheme(scheme_id)
    return {
        "status": "success" if success else "failed",
        "message": "योजना सफलतापूर्वक हटा दी गई",
        "scheme_id": scheme_id
    }


@router.post("/schemes/{scheme_id}/verify")
def admin_verify_scheme(scheme_id: str, req: VerifyRequest = VerifyRequest()):
    """
    Stamps a scheme as verified by an administrator with current timestamp.
    """
    existing = get_scheme_by_id(scheme_id)
    if not existing:
        raise HTTPException(status_code=404, detail="योजना नहीं मिली (Scheme not found)")

    verified = mark_scheme_verified(scheme_id, verifier=req.verifier_name or "Admin")
    return {
        "status": "success",
        "message": f"योजना '{verified.get('scheme_name_hindi')}' आधिकारिक रूप से सत्यापित की गई",
        "scheme": verified
    }


@router.get("/sync/status")
def admin_get_sync_status():
    """
    Returns real-time status of all external government connectors (myScheme, API Setu, OGD).
    """
    return connector_manager.get_all_health()


@router.post("/sync/trigger")
def admin_trigger_sync(source_id: Optional[str] = None):
    """
    Executes synchronization across government sources and logs audit trail.
    """
    return connector_manager.run_sync(source_id=source_id)


@router.get("/sync/logs")
def admin_get_sync_logs():
    """
    Returns chronological audit history of government data synchronizations.
    """
    return get_sync_audit_logs()
