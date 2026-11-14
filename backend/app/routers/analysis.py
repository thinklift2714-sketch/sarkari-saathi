"""
Router for Real-time AI Scheme Research and Eligibility Analysis (SSE stream).
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.services.analysis_service import analysis_service
from app.database import get_current_profile, get_session_profile, get_user_profile, create_empty_profile
from app.auth_deps import get_optional_user, AuthenticatedUser

router = APIRouter(prefix="/schemes/analyze", tags=["AI Scheme Research & Analysis"])


class StartAnalysisRequest(BaseModel):
    user_input: Optional[str] = ""
    profile: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


@router.post("")
def start_analysis(req: StartAnalysisRequest, user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Initiates a real 6-stage government scheme research & analysis job.
    Returns the unique analysis_id and SSE stream URL.
    """
    profile = req.profile
    if not profile:
        if user and get_user_profile(user.id):
            profile = get_user_profile(user.id)
        elif req.session_id:
            profile = get_session_profile(req.session_id)
        else:
            # FIXED: Use empty profile instead of Seeta Devi (DB_PROFILE) for anonymous users
            # This prevents profile contamination across sessions
            profile = create_empty_profile()

    aid = analysis_service.create_session(user_input=req.user_input or "", profile=profile)
    return {
        "analysis_id": aid,
        "status": "started",
        "stream_url": f"/api/schemes/analyze/{aid}/progress",
        "result_url": f"/api/schemes/analyze/{aid}/result"
    }


@router.get("/{analysis_id}/progress")
async def stream_analysis_progress(analysis_id: str, request: Request):
    """
    Server-Sent Events (SSE) endpoint that streams real-time progress for all 6 research stages:
    1. Understanding your situation
    2. Building your beneficiary profile
    3. Searching official government sources
    4. Analysing scheme eligibility
    5. Checking documents and application requirements
    6. Preparing personalised recommendations
    """
    session = analysis_service.get_session(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session not found")

    async def event_generator():
        async for chunk in analysis_service.execute_and_stream(analysis_id):
            # Check if client disconnected
            if await request.is_disconnected():
                break
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{analysis_id}/result")
def get_analysis_result(analysis_id: str):
    """
    Returns the completed research report for a given analysis_id.
    """
    session = analysis_service.get_session(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session not found")
    if not session.result:
        return {
            "analysis_id": analysis_id,
            "status": session.status,
            "current_stage": session.current_stage,
            "message": "Analysis is still running or pending"
        }
    return session.result
