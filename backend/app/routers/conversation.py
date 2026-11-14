import re
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any, List

logger = logging.getLogger("sarkari_saathi.conversation")
from app.schemas.conversation import (
    ConversationRequest,
    ConversationResponse,
    ConversationHeader,
    ConversationDetail,
    CreateConversationRequest,
    UpdateConversationRequest,
)
from app.services.input_validator import input_validator, InputCategory
from app.services.profile_extractor import profile_extractor
from app.services.gemini_service import gemini_service
from app.services.discovery_service import discovery_service
from app.services.research_logger import research_logger
from app.database import (
    get_current_profile,
    update_profile,
    get_session_profile,
    update_session_profile,
    replace_session_profile,
    replace_user_profile,
    replace_demo_profile,
    get_user_profile,
    save_user_profile,
    get_user_conversations,
    create_conversation,
    get_conversation,
    add_conversation_message,
    delete_conversation,
    rename_conversation,
)
from app.auth_deps import get_optional_user, get_current_user, AuthenticatedUser

router = APIRouter(prefix="/conversation", tags=["AI Conversation"])


def detect_language(text: str) -> str:
    """
    Detects whether the citizen input is:
    - 'hi' (Devanagari Hindi)
    - 'hinglish' (Hindi in Latin script / mixed words)
    - 'en' (English)
    """
    if not text:
        return "hi"
    # 1. Devanagari character range
    if len(re.findall(r'[\u0900-\u097F]', text)) > 0:
        return "hi"

    # 2. Hinglish vocabulary markers
    hinglish_markers = {
        "kisan", "kheti", "mera", "meri", "mere", "mujhe", "hum", "humein", "chahiye",
        "hai", "hain", "hoon", "tha", "thi", "the", "karta", "karti", "karte", "raha", "rahi",
        "kaise", "kya", "kab", "kahan", "kyun", "nahi", "nahin", "bahut", "kam", "jyada",
        "aur", "bhi", "lekin", "par", "ke", "ki", "ko", "se", "mein", "me", "saal", "varsh",
        "aay", "aamdani", "kamai", "vidhwa", "pati", "padhai", "shiksha", "naukri", "rozgar",
        "batao", "bataiye", "namaste", "pranam", "karo", "karen", "bhai"
    }
    words = [w.lower() for w in re.findall(r'[a-zA-Z]+', text)]
    hinglish_count = sum(1 for w in words if w in hinglish_markers)
    if hinglish_count >= 2 or (len(words) <= 6 and hinglish_count >= 1):
        return "hinglish"

    return "en"


def _generate_targeted_followup(
    extracted: Dict[str, Any],
    merged_profile: Dict[str, Any],
    missing: List[str],
    lang: str = "hi"
) -> str:
    """
    Generates a targeted, polite follow-up question for missing critical fields
    providing clear bilingual support (Hindi + English/Hinglish).
    """
    occ = (merged_profile.get("occupation") or "").lower()
    req = (merged_profile.get("assistance_requirement") or "").lower()
    state = merged_profile.get("state")
    age = merged_profile.get("age")
    is_widow = merged_profile.get("marital_status") == "विधवा"

    # Priority 1: Bereavement / Widow handling
    if is_widow:
        if not age or "age" in missing:
            return "मुझे यह जानकर अत्यंत दुख हुआ। इस कठिन समय में सरकार की कई योजनाएं आपके साथ हैं। क्या आप अपनी उम्र बता सकती हैं? (I am sorry for your loss. Could you please share your age for pension schemes?)"
        if not state or "state" in missing:
            return "मुझे यह जानकर दुख हुआ। कृपया बताएं कि आप किस राज्य और जिले में रहती हैं? (Which state and district do you live in?)"

    # 1. State / District is missing
    if "state" in missing:
        if ("किसान" in occ or "farmer" in occ or req == "agriculture") and not is_widow:
            return "नमस्ते किसान भाई! योजनाओं की पात्रता हर राज्य में अलग होती है। आप किस राज्य और जिले में रहते हैं? (Which state and district do you live in?)"
        elif "बेरोजगार" in occ or "unemployed" in occ or req == "employment":
            return "नमस्ते! रोजगार और युवा कल्याण योजनाओं के लिए कृपया अपना राज्य और जिला बताएं। (Please share your state and district for employment schemes.)"
        elif req == "education" or "छात्र" in occ or "student" in occ:
            return "नमस्ते! छात्रवृत्ति और पढ़ाई सहायता योजनाओं के लिए कृपया बताएं कि आप किस राज्य और जिले में पढ़ाई कर रहे हैं? (Which state and district are you studying in for scholarship schemes?)"
        else:
            return "नमस्ते! सही सरकारी योजना खोजने के लिए कृपया बताएं कि आप किस राज्य और जिले में रहते हैं? (Which state and district do you reside in?)"

    # 2. Age is missing
    if "age" in missing:
        if merged_profile.get("marital_status") == "विधवा":
            return "मुझे यह जानकर अत्यंत दुख हुआ। इस कठिन समय में सरकार की कई योजनाएं आपके साथ हैं। क्या आप अपनी उम्र बता सकती हैं?"
        return f"धन्यवाद! आपके क्षेत्र ({state or 'उत्तर प्रदेश'}) के लिए योजनाएं देखने हेतु कृपया अपनी आयु (उम्र) बताएं। (Please share your current age.)"

    # 3. Farmer landholding is missing
    if "landholding" in missing and ("किसान" in occ or "farmer" in occ or req == "agriculture"):
        return "कृषि व किसान योजनाओं (जैसे पीएम-किसान, केसीसी) के लिए कृपया बताएं कि आपके पास लगभग कितनी जमीन (एकड़ या बीघा) है? (Approximately how much agricultural land does your family own?)"

    # 4. Income is missing
    if "annual_income" in missing:
        return "पात्रता सीमा की पुष्टि के लिए कृपया अपने परिवार की लगभग वार्षिक आय (जैसे ₹50,000 या ₹1 लाख) बताएं। (What is your approximate annual household income?)"

    # 5. Education is missing for youth/students
    if "education" in missing and ("बेरोजगार" in occ or req == "employment" or req == "education" or "student" in occ):
        return "छात्रवृत्ति व रोजगार योजनाओं की पात्रता के लिए आपकी कक्षा/पढ़ाई और उच्चतम शैक्षणिक योग्यता क्या है? (What is your current class/course and qualification?)"

    # Fallback general follow-up
    return "धन्यवाद! सही योजना की पात्रता सुनिश्चित करने के लिए कृपया अपनी पारिवारिक स्थिति और आवश्यकता के बारे में थोड़ा और बताएं। (Please share a few more details about your situation.)"


# =====================================================================
# CONVERSATION CRUD ENDPOINTS (Persistent Chat History)
# =====================================================================

@router.get("", response_model=List[ConversationHeader])
def list_user_conversations(user: Optional[AuthenticatedUser] = Depends(get_optional_user)):
    """
    Returns list of saved conversations for the authenticated user.
    New users start with an empty list [].
    """
    if not user:
        return []
    convs = get_user_conversations(user.id)
    return [ConversationHeader(**c) for c in convs]


@router.post("", response_model=ConversationDetail)
def create_new_conversation(
    req: CreateConversationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Creates a new conversation record for the authenticated user.
    """
    conv = create_conversation(user.id, title=req.title)
    return ConversationDetail(**conv)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_single_conversation(
    conversation_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieves full message history for a conversation belonging to user.
    """
    conv = get_conversation(user.id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="संवाद नहीं मिला (Conversation not found)")
    return ConversationDetail(**conv)


@router.delete("/{conversation_id}")
def delete_single_conversation(
    conversation_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Deletes a conversation and its messages.
    """
    success = delete_conversation(user.id, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="संवाद नहीं मिला (Conversation not found)")
    return {"status": "success", "message": "संवाद हटा दिया गया"}


@router.patch("/{conversation_id}")
def rename_single_conversation(
    conversation_id: str,
    req: UpdateConversationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Renames a conversation.
    """
    success = rename_conversation(user.id, conversation_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="संवाद नहीं मिला (Conversation not found)")
    return {"status": "success", "message": "संवाद का नाम बदल दिया गया", "title": req.title}


# =====================================================================
# CHAT MESSAGE PROCESSING ENDPOINT
# =====================================================================

@router.post("/message", response_model=ConversationResponse)
def handle_conversation_message(
    req: ConversationRequest,
    user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    Conversational AI pipeline for government scheme discovery.
    1. Language Detection (English, Hindi, Hinglish)
    2. Input Validation (rejection of gibberish, greetings, unrelated queries)
    3. Profile Extraction without hallucinating
    4. Follow-up questioning for missing critical fields
    5. Deterministic Scheme Discovery & Eligibility Evaluation
    6. Permanent message persistence in Supabase/Isolated storage
    """
    trace = research_logger.create_trace(user_input=req.message)
    detected_lang = detect_language(req.message)

    # -------------------------------------------------------------
    # 0. Resolve Conversation Container for Persistence
    # -------------------------------------------------------------
    user_id = user.id if user else (req.session_id or req.conversation_id or "anonymous")
    conv_id = req.conversation_id
    if user and not conv_id:
        # Auto-create conversation if none was provided
        new_conv = create_conversation(user.id)
        conv_id = new_conv["id"]
    elif not user and not conv_id:
        conv_id = req.session_id or str(uuid.uuid4())

    # Save user message to persistent conversation
    if user and conv_id:
        add_conversation_message(user.id, conv_id, role="user", content=req.message)

    # -------------------------------------------------------------
    # 1. Retrieve current active profile
    # For logged-in users: ALWAYS start from the saved welfare profile (state, age, etc.),
    # then overlay anything the frontend sent in current_profile.
    # This prevents the auth account profile (name, avatar_url) from masking welfare fields.
    # For anonymous users: Check session/conversation stores.
    # -------------------------------------------------------------
    if user:
        saved_welfare = get_user_profile(user.id) or {}
        # req.current_profile may carry welfare fields from the frontend session;
        # filter out pure auth-account keys (name, avatar_url, email, id, user_id, members)
        _AUTH_ONLY_KEYS = {"name", "avatar_url", "email", "id", "user_id", "members", "family_size"}
        frontend_welfare = {k: v for k, v in (req.current_profile or {}).items()
                            if k not in _AUTH_ONLY_KEYS and v not in (None, "", 0, 0.0, False)}
        profile = {**dict(saved_welfare), **frontend_welfare}
    elif req.session_id:
        profile = dict(get_session_profile(req.session_id))
    elif conv_id:
        profile = dict(get_session_profile(conv_id))
    elif req.current_profile:
        profile = dict(req.current_profile)
    else:
        profile = {}

    if req.current_profile and not user:
        extra_w = {k: v for k, v in req.current_profile.items() if v not in (None, "", 0, 0.0, False)}
        profile = {**profile, **extra_w}

    # -------------------------------------------------------------
    # STAGE 1: Strict User Input Validation
    # Pass existing profile context so standalone answers ("45", "आगरा", "हाँ") are not rejected
    # -------------------------------------------------------------
    val_res = input_validator.classify(req.message, existing_profile=profile)
    trace.input_validation_result = val_res
    category = val_res["category"]

    # If input is GIBBERISH, UNRELATED, or GREETING:
    # STOP the pipeline immediately! Never recommend schemes!
    if category in [
        InputCategory.RANDOM_OR_GIBBERISH_TEXT,
        InputCategory.UNRELATED_MESSAGE,
        InputCategory.GREETING,
        InputCategory.UNSAFE_OR_UNSUPPORTED_REQUEST
    ]:
        trace.status = "rejected_by_input_validation"
        research_logger.log_trace(trace)

        # Select appropriate response message providing bilingual clarity
        if detected_lang == "en":
            if category == InputCategory.GREETING:
                resp_message = (
                    "नमस्ते! मैं सरकारी साथी (Sarkari Saathi) हूँ। Hello! I help citizens discover and verify "
                    "eligibility for official government welfare schemes. Please let me know what assistance you need "
                    "(e.g. farming, scholarships, pensions, housing, self-employment)."
                )
            elif category == InputCategory.UNRELATED_MESSAGE:
                resp_message = (
                    "सरकारी साथी केवल भारत सरकार और राज्य सरकारों की कल्याणकारी योजनाओं के लिए है। "
                    "(Sarkari Saathi is dedicated to assisting with official government welfare schemes, scholarships, and pensions. "
                    "Please describe your government scheme-related requirement.)"
                )
            elif category == InputCategory.RANDOM_OR_GIBBERISH_TEXT:
                resp_message = (
                    "क्षमा करें, आपका संदेश समझ नहीं आया। कृपया स्पष्ट शब्दों में अपनी आवश्यकता बताएं। "
                    "(Sorry, your message could not be understood. Please clearly describe your situation or the government assistance you need.)"
                )
            else:
                resp_message = val_res.get("feedback_message_hi")
        elif detected_lang == "hinglish":
            if category == InputCategory.GREETING:
                resp_message = (
                    "नमस्ते! मैं सरकारी साथी (Sarkari Saathi) हूँ। Main Bharat sarkar aur rajya sarkaron ki "
                    "welfare schemes mein aapki patrata (eligibility) check karne mein madad karta hoon. "
                    "Aap kis tarah ki assistance chahte hain? (jaise education scholarship, farmer yojna, pension ya loan)"
                )
            elif category == InputCategory.UNRELATED_MESSAGE:
                resp_message = (
                    "सरकारी साथी केवल सरकारी योजनाओं के लिए है। Sarkari Saathi keval government welfare schemes, scholarships aur subsidies ke liye hai. "
                    "Kripya apni sarkar-sambandhit zaroorat ya sthiti batayein."
                )
            else:
                resp_message = "क्षमा करें, आपका संदेश समझ नहीं आया। Kripya apni sthiti, age, occupation ya jis scheme ki requirement hai use spasht shabdon mein batayein."
        else:
            resp_message = val_res.get("feedback_message_hi")

        next_action = "greeting" if category == InputCategory.GREETING else "ask_clarification"

        # Save assistant message to persistent conversation
        if user and conv_id:
            add_conversation_message(
                user.id,
                conv_id,
                role="assistant",
                content=resp_message,
                metadata={"category": category, "next_action": next_action}
            )

        return ConversationResponse(
            message=resp_message,
            conversation_id=conv_id,
            extracted_data={},
            missing_fields=[],
            next_action=next_action,
            matched_schemes_count=0,
            total_discovered=0,
            top_schemes=[]
        )

    # -------------------------------------------------------------
    # STAGE 2: Structured Profile Extraction
    # -------------------------------------------------------------
    extraction_res = profile_extractor.extract(req.message, existing_profile=profile)
    extracted_data = extraction_res["extracted_data"]
    missing_critical = extraction_res["missing_critical_fields"]
    is_fresh_profile = extraction_res.get("is_fresh_profile", False)

    trace.profile_fields_extracted = extracted_data
    trace.missing_profile_fields = missing_critical

    # Persist newly extracted data onto citizen profile
    if is_fresh_profile:
        # A fresh persona has been provided. Wipe prior profile state completely.
        if user:
            profile = replace_user_profile(user.id, extracted_data)
        elif req.session_id:
            profile = replace_session_profile(req.session_id, extracted_data)
        elif conv_id:
            profile = replace_session_profile(conv_id, extracted_data)
        else:
            profile = replace_demo_profile(extracted_data)
    elif extracted_data:
        if user:
            save_user_profile(user.id, extracted_data)
        elif req.session_id:
            update_session_profile(req.session_id, extracted_data)
        elif conv_id:
            update_session_profile(conv_id, extracted_data)
        else:
            update_profile(extracted_data)
        profile = {**profile, **extracted_data}

    # -------------------------------------------------------------
    # STAGE 3: Incomplete Beneficiary Request Handling
    # -------------------------------------------------------------
    # Check whether the MERGED profile (existing + newly extracted) has enough to run schemes.
    # Only block and ask follow-up if the MERGED profile is still missing critical fields.
    merged_has_state = bool(profile.get("state"))
    merged_has_age = profile.get("age") is not None

    # If merged profile has both state and age, we have enough to discover schemes.
    # Also allow scheme search if the input was classified as VALID_BENEFICIARY_REQUEST
    # (e.g. rich one-shot message with many attributes).
    can_proceed_to_schemes = (
        merged_has_state and merged_has_age
    ) or category == InputCategory.VALID_BENEFICIARY_REQUEST

    # For farmer-specific critical: landholding
    # Only block on missing landholding if we know the user is a farmer and has nothing yet
    occ = profile.get("occupation") or ""
    req_type = profile.get("assistance_requirement") or ""
    is_farmer = "किसान" in occ or "farmer" in occ.lower() or req_type == "agriculture"
    is_widow = profile.get("marital_status") == "विधवा"

    # Remove landholding from critical missing if occupation isn't farmer or if already in profile
    if "landholding" in missing_critical and (not is_farmer or is_widow or profile.get("landholding") is not None):
        missing_critical = [f for f in missing_critical if f != "landholding"]

    # If we still cannot proceed (e.g. state or age is missing), ask ONE targeted follow-up
    if not can_proceed_to_schemes:
        # Determine the most important missing field
        still_missing = []
        if not merged_has_state:
            still_missing.append("state")
        if not merged_has_age:
            still_missing.append("age")
        if is_farmer and not is_widow and profile.get("landholding") is None:
            still_missing.append("landholding")

        followup_msg = _generate_targeted_followup(
            extracted_data, profile, still_missing, lang=detected_lang
        )
        trace.status = "followup_requested"
        research_logger.log_trace(trace)

        if user and conv_id:
            add_conversation_message(
                user.id,
                conv_id,
                role="assistant",
                content=followup_msg,
                metadata={"next_action": "ask_followup", "missing_fields": still_missing}
            )

        return ConversationResponse(
            message=followup_msg,
            conversation_id=conv_id,
            extracted_data=extracted_data,
            missing_fields=still_missing,
            is_fresh_profile=is_fresh_profile,
            next_action="ask_followup",
            matched_schemes_count=0,
            total_discovered=0,
            top_schemes=[]
        )

    # -------------------------------------------------------------
    # STAGE 4: Official Scheme Discovery & Python Eligibility Evaluation
    # (Only runs when input is VALID and profile has enough critical data)
    # -------------------------------------------------------------
    disc = discovery_service.discover_schemes(profile)
    eligible_list = disc["results"]["eligible"]
    potential_list = disc["results"]["potentially_eligible"]
    eligible_count = len(eligible_list)
    total_discovered = eligible_count + len(potential_list)

    trace.candidate_schemes_retrieved = disc["summary"]["total_discovered"]
    trace.schemes_evaluated = disc["summary"]["total_evaluated"]
    trace.recommendations_returned = eligible_list or potential_list
    trace.status = "completed"
    research_logger.log_trace(trace)

    rejected_list = disc["results"].get("not_eligible", [])
    accepted_summary = [s.get("scheme_name") for s in eligible_list]
    rejected_summary = [
        {"name": s.get("scheme_name"), "reason": s.get("explanation")}
        for s in rejected_list[:10]
    ]

    logger.info(f"[ELIGIBILITY DEBUG] 1. Original User Input: {req.message}")
    logger.info(f"[ELIGIBILITY DEBUG] 2. Extracted Profile: {extracted_data}")
    logger.info(f"[ELIGIBILITY DEBUG] 3. Profile Passed to Engine: {profile}")
    logger.info(f"[ELIGIBILITY DEBUG] 4a. Accepted Schemes ({len(eligible_list)}): {accepted_summary}")
    logger.info(f"[ELIGIBILITY DEBUG] 4b. Sample Rejected Schemes ({len(rejected_list)}): {rejected_summary}")

    debug_trace_dict = {
        "user_input": req.message,
        "extracted_profile": extracted_data,
        "engine_profile": profile,
        "accepted_schemes": accepted_summary,
        "rejected_schemes": rejected_summary,
        "total_evaluated": disc["summary"]["total_evaluated"]
    }

    top_candidates = eligible_list if eligible_count > 0 else potential_list

    # Check if user is asking for official website/application links
    lowered_msg = req.message.lower()
    is_portal_request = any(kw in lowered_msg for kw in [
        "वेबसाइट", "वेबसाईट", "पोर्टल", "आधिकारिक", "लिंक", "आवेदन",
        "website", "portal", "official", "link", "registration",
        "कहाँ", "कहां", "कैसे", "how to", "where to"
    ])

    if detected_lang == "en":
        top_names = ", ".join([f"'{s.get('scheme_name', s.get('scheme_name_hindi'))}'" for s in top_candidates[:3]])
        if is_portal_request and top_candidates:
            portal_lines = []
            for s in top_candidates[:3]:
                sname = s.get("scheme_name") or s.get("scheme_name_hindi")
                portal = s.get("official_application_url") or s.get("official_website")
                if portal:
                    portal_lines.append(f"• {sname}: {portal}")
            if portal_lines:
                reply_msg = "Here are the official application portals for your recommended schemes:\n\n" + "\n".join(portal_lines) + "\n\nAll links are from official government websites. Click 'View Details' for step-by-step instructions."
            else:
                reply_msg = "Official application links are available in the 'How to Apply' section. Click on any recommended scheme and select 'Application Process' for direct portal links."
        elif eligible_count > 0:
            reply_msg = (
                f"Thank you! Based on your profile, we found {eligible_count} eligible government welfare schemes "
                f"tailored to your family, including {top_names}. Click 'View Details' to see full requirements and application links."
            )
        elif len(potential_list) > 0:
            reply_msg = (
                f"Thank you! We found {len(potential_list)} potentially applicable government schemes (such as {top_names}). "
                f"Some conditions need document confirmation. Click 'View Details' to explore."
            )
        else:
            reply_msg = (
                "Based on the provided information, no directly eligible schemes were found. "
                "Please share more details about your specific circumstances or requirements."
            )
    elif detected_lang == "hinglish":
        top_names = ", ".join([f"'{s.get('scheme_name_hindi', s.get('scheme_name'))}'" for s in top_candidates[:3]])
        if is_portal_request and top_candidates:
            portal_lines = []
            for s in top_candidates[:3]:
                sname = s.get("scheme_name_hindi") or s.get("scheme_name")
                portal = s.get("official_application_url") or s.get("official_website")
                if portal:
                    portal_lines.append(f"• {sname}: {portal}")
            if portal_lines:
                reply_msg = "Aapki recommended schemes ke official portals:\n\n" + "\n".join(portal_lines) + "\n\nSabhi links official government websites se hain."
            else:
                reply_msg = "Official links 'Application Process' section mein available hain. Scheme par click karein."
        elif eligible_count > 0:
            reply_msg = (
                f"Dhanyavaad! Aapki details ke basis par humein aapke liye {eligible_count} eligible government schemes mili hain, "
                f"jinme {top_names} shaamil hain. Puri eligibility aur documents dekhne ke liye 'Results' dekhein."
            )
        elif len(potential_list) > 0:
            reply_msg = (
                f"Dhanyavaad! Humein aapke liye {len(potential_list)} prospective schemes mili hain ({top_names}). "
                f"Documents aur conditions check karne ke liye 'Results' dekhein."
            )
        else:
            reply_msg = (
                "Aapki current details par koi direct match nahi mila. "
                "Kripya thoda aur bataiye taaki sahi scheme khoji ja sake."
            )
    else:
        top_names = ", ".join([f"'{s.get('scheme_name_hindi') or s.get('scheme_name')}'" for s in top_candidates[:3]])
        if is_portal_request and top_candidates:
            portal_lines = []
            for s in top_candidates[:3]:
                sname = s.get("scheme_name_hindi") or s.get("scheme_name")
                portal = s.get("official_application_url") or s.get("official_website")
                if portal:
                    portal_lines.append(f"• {sname}: {portal}")
            if portal_lines:
                reply_msg = "आपकी अनुशंसित योजनाओं के आधिकारिक आवेदन पोर्टल:\n\n" + "\n".join(portal_lines) + "\n\nसभी लिंक आधिकारिक सरकारी वेबसाइटों से हैं। पूरी प्रक्रिया के लिए 'आवेदन प्रक्रिया' टैब देखें।"
            else:
                reply_msg = "आधिकारिक आवेदन लिंक आपके परिणामों में 'आवेदन प्रक्रिया' अनुभाग में उपलब्ध हैं। किसी भी योजना पर क्लिक करें।"
        elif eligible_count > 0:
            reply_msg = (
                f"धन्यवाद! आपकी दर्ज जानकारी के आधार पर हमें आपके लिए {eligible_count} उपयुक्त सरकारी योजनाएँ मिली हैं, "
                f"जिनमें {top_names} शामिल हैं। पूरी पात्रता और शर्तों की जाँच देखने के लिए 'एआई विश्लेषण देखें' दबाएं।"
            )
        elif len(potential_list) > 0:
            reply_msg = (
                f"धन्यवाद! हमें आपके लिए {len(potential_list)} संभावित योजनाएं मिली हैं (जैसे {top_names})। "
                f"पूरी पात्रता और शर्तों की जाँच के लिए 'एआई विश्लेषण देखें' दबाएं।"
            )
        else:
            reply_msg = (
                "आपकी दर्ज जानकारी के आधार पर वर्तमान में कोई सटीक योजना नहीं मिली। "
                "कृपया अपनी आवश्यकता के बारे में कुछ और विवरण दें।"
            )

    # Soft hint about landholding for farmers (not a blocker — schemes already shown)
    if is_farmer and not is_widow and profile.get("landholding") is None and not is_portal_request:
        if detected_lang != "en":
            reply_msg += "\n\n💡 यदि आप अपनी जमीन का विवरण (एकड़ या बीघा में) भी बताएं, तो पीएम-किसान और केसीसी जैसी योजनाओं की पात्रता और सटीक रूप से जाँची जा सकती है।"
        else:
            reply_msg += "\n\n💡 Sharing your landholding details (acres/bigha) helps verify eligibility for PM-KISAN and KCC more accurately."
    top_schemes_data = [
        {
            "id": s.get("scheme_id"),
            "name": s.get("scheme_name_hindi") or s.get("scheme_name"),
            "name_en": s.get("scheme_name"),
            "scheme_name": s.get("scheme_name"),
            "scheme_name_hindi": s.get("scheme_name_hindi"),
            "department": s.get("department_hindi"),
            "department_en": s.get("department"),
            "status": s.get("status"),
            "benefit": (
                s.get("benefits", {}).get("description_hindi")
                if detected_lang != "en"
                else s.get("benefits", {}).get("description") or s.get("benefits", {}).get("description_hindi")
            )
        }
        for s in top_candidates[:4]
    ]

    matched_count = total_discovered

    if user and conv_id:
        add_conversation_message(
            user.id,
            conv_id,
            role="assistant",
            content=reply_msg,
            metadata={
                "matched_count": matched_count,
                "top_schemes": top_schemes_data,
                "next_action": "ready_for_results" if matched_count > 0 else "ask_followup"
            }
        )

    return ConversationResponse(
        message=reply_msg,
        conversation_id=conv_id,
        extracted_data=extracted_data,
        missing_fields=[],
        is_fresh_profile=is_fresh_profile,
        next_action="ready_for_results" if matched_count > 0 else "ask_followup",
        matched_schemes_count=matched_count,
        total_discovered=total_discovered,
        top_schemes=top_schemes_data,
        debug_trace=debug_trace_dict
    )
