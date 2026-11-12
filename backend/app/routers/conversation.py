from fastapi import APIRouter, Depends
from typing import Optional
from app.schemas.conversation import ConversationRequest, ConversationResponse
from app.services.gemini_service import gemini_service
from app.database import (
    get_current_profile,
    update_profile,
    get_session_profile,
    update_session_profile,
    get_user_profile,
    save_user_profile
)
from app.auth_deps import get_optional_user, AuthenticatedUser
from app.services.discovery_service import discovery_service

router = APIRouter(prefix="/conversation", tags=["AI Conversation"])


@router.post("/message", response_model=ConversationResponse)
def handle_conversation_message(
    req: ConversationRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    # Retrieve profile: explicit profile, session-specific, authenticated user, or new conversation state
    if req.current_profile:
        profile = req.current_profile
    elif user and get_user_profile(user.id):
        profile = get_user_profile(user.id)
    elif req.session_id:
        profile = get_session_profile(req.session_id)
    else:
        # If starting a fresh chat turn without explicit profile, do not pollute with pre-filled age/status
        if len(req.history) == 0:
            profile = {"state": "उत्तर प्रदेश"}
        else:
            profile = get_current_profile()

    # Convert chat history to dicts
    hist = [{"role": m.role, "content": m.content} for m in req.history]

    # Process conversation with Gemini or rule-based fallback
    result = gemini_service.converse(req.message, hist, profile)

    # If any structured data was extracted, persist to profile
    if result.get("extracted_data"):
        if user:
            save_user_profile(user.id, result["extracted_data"])
        elif req.session_id:
            update_session_profile(req.session_id, result["extracted_data"])
        else:
            update_profile(result["extracted_data"])
        profile = {**profile, **result["extracted_data"]}

    # Perform real multi-criteria discovery
    disc = discovery_service.discover_schemes(profile)
    eligible_list = disc["results"]["eligible"]
    potential_list = disc["results"]["potentially_eligible"]
    eligible_count = len(eligible_list)
    total_discovered = eligible_count + len(potential_list)

    msg = result["message"]
    # If ready for results, dynamically craft or refine the response with accurate discovered counts
    if result.get("next_action") == "ready_for_results":
        top_3_names = ", ".join([f"'{s['scheme_name_hindi']}'" for s in eligible_list[:3]])
        if eligible_count > 0:
            msg = (
                f"धन्यवाद! आपकी जानकारी के आधार पर हमें आपके लिए {eligible_count} उपयुक्त सरकारी योजनाएँ मिली हैं, "
                f"जिनमें {top_3_names} शामिल हैं। पूरा एआई अनुसंधान और शर्तों की जाँच देखने के लिए 'एआई विश्लेषण देखें' बटन दबाएं।"
            )
        else:
            msg = f"धन्यवाद! हमें आपके लिए {len(potential_list)} संभावित योजनाएं मिली हैं। अधिक विवरण के लिए 'योजनाएं' देखें।"

    top_schemes_data = [
        {
            "id": s.get("scheme_id"),
            "name": s.get("scheme_name_hindi"),
            "department": s.get("department_hindi"),
            "status": s.get("status"),
            "benefit": s.get("benefits", {}).get("description_hindi")
        }
        for s in eligible_list[:4]
    ]

    return ConversationResponse(
        message=msg,
        extracted_data=result.get("extracted_data", {}),
        missing_fields=result.get("missing_fields", []),
        next_action=result.get("next_action", "ask_followup"),
        matched_schemes_count=eligible_count,
        total_discovered=total_discovered,
        top_schemes=top_schemes_data
    )
