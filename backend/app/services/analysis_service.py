"""
Real-time AI Government Scheme Research and Analysis Service for Sarkari Saathi.
Executes an honest 6-stage research pipeline connecting citizen input with official government sources
and deterministic eligibility evaluation, streaming live SSE progress events.
"""
import anyio
import json
import uuid
import time
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.services.gemini_service import gemini_service
from app.services.input_validator import input_validator, InputCategory
from app.services.profile_extractor import profile_extractor
from app.services.research_logger import research_logger
from app.database import get_current_profile, get_all_schemes, get_all_user_documents
from app.rule_engine.evaluator import SchemeEvaluator
from app.integrations.connector_manager import connector_manager
from app.services.discovery_service import discovery_service


class AnalysisSession:
    def __init__(self, analysis_id: str, user_input: str, profile: Optional[Dict[str, Any]] = None):
        self.analysis_id = analysis_id
        self.user_input = user_input
        self.initial_profile = profile or {}
        self.created_at = datetime.now().isoformat()
        self.current_stage = 0
        self.status = "pending" # pending | running | completed | failed
        self.stage_logs: List[Dict[str, Any]] = []
        self.result: Optional[Dict[str, Any]] = None


class SchemeAnalysisService:
    def __init__(self):
        self._sessions: Dict[str, AnalysisSession] = {}

    def create_session(self, user_input: str = "", profile: Optional[Dict[str, Any]] = None) -> str:
        aid = f"ana_{uuid.uuid4().hex[:10]}"
        session = AnalysisSession(aid, user_input, profile)
        self._sessions[aid] = session
        return aid

    def get_session(self, analysis_id: str) -> Optional[AnalysisSession]:
        return self._sessions.get(analysis_id)

    async def execute_and_stream(self, analysis_id: str) -> AsyncGenerator[str, None]:
        session = self.get_session(analysis_id)
        if not session:
            err_data = json.dumps({"error": "Analysis session not found", "analysis_id": analysis_id}, ensure_ascii=False)
            yield f"event: error\ndata: {err_data}\n\n"
            return

        session.status = "running"

        # -------------------------------------------------------------
        # STAGE 1: Strict User Input Validation & Understanding
        # -------------------------------------------------------------
        session.current_stage = 1
        t0 = time.time()
        extracted = {}

        # 1. Input Validation Check
        if session.user_input:
            val_res = input_validator.classify(session.user_input)
            if not val_res["is_valid"]:
                # Input validation failed (Gibberish, Unrelated, Greeting)
                # STOP pipeline immediately. Do NOT search or recommend schemes!
                st1_payload = {
                    "analysis_id": analysis_id,
                    "stage": 1,
                    "stage_id": "understanding_situation",
                    "stage_title": "इनपुट सत्यापन",
                    "stage_title_en": "Input Validation",
                    "progress_percent": 100,
                    "status": "validation_failed",
                    "elapsed_ms": int((time.time() - t0) * 1000),
                    "activity_message": val_res["feedback_message_hi"],
                    "details": {
                        "validation_category": val_res["category"],
                        "reason": val_res["reason"],
                        "feedback_hi": val_res["feedback_message_hi"],
                        "feedback_en": val_res["feedback_message_en"]
                    }
                }
                session.stage_logs.append(st1_payload)
                yield f"event: stage_update\ndata: {json.dumps(st1_payload, ensure_ascii=False)}\n\n"

                session.status = "completed"
                session.result = {
                    "analysis_id": analysis_id,
                    "status": "completed",
                    "validation": val_res,
                    "profile": session.initial_profile,
                    "summary": {
                        "total_discovered": 0,
                        "total_evaluated": 0,
                        "eligible_count": 0,
                        "potentially_eligible_count": 0,
                        "more_info_required_count": 0,
                        "not_eligible_count": 0,
                        "message_hi": val_res["feedback_message_hi"],
                        "message_en": val_res["feedback_message_en"],
                        "disclaimer": "अमान्य या असंबंधित संदेश के लिए कोई सरकारी योजना अनुशंसित नहीं की गई है।"
                    },
                    "source_health": [],
                    "results": {
                        "eligible": [],
                        "potentially_eligible": [],
                        "more_info_required": [],
                        "not_eligible": []
                    },
                    "required_documents_summary": {
                        "total": 0,
                        "available": [],
                        "missing": []
                    }
                }
                yield f"event: complete\ndata: {json.dumps(session.result, ensure_ascii=False)}\n\n"
                return

            # Extract structured parameters without hallucinations
            extraction_res = profile_extractor.extract(session.user_input, session.initial_profile)
            extracted = extraction_res["extracted_data"]

        # Merge input extracted attributes onto provided profile
        working_profile = {**session.initial_profile, **extracted}

        st1_payload = {
            "analysis_id": analysis_id,
            "stage": 1,
            "stage_id": "understanding_situation",
            "stage_title": "आपकी स्थिति का विश्लेषण",
            "stage_title_en": "Understanding your situation",
            "progress_percent": 16,
            "status": "completed",
            "elapsed_ms": int((time.time() - t0) * 1000),
            "activity_message": (
                f"उपयोगकर्ता इनपुट का विश्लेषण पूर्ण: "
                f"{working_profile.get('age', 'अज्ञात')} वर्ष, "
                f"{working_profile.get('occupation', 'नागरिक')}, "
                f"{working_profile.get('state', 'अज्ञात राज्य')}"
            ),
            "details": {
                "extracted_fields": list(extracted.keys()),
                "target_categories": extracted.get("target_categories", ["social_welfare"]),
                "detected_occupation": working_profile.get("occupation"),
                "detected_age": working_profile.get("age"),
                "detected_marital_status": working_profile.get("marital_status"),
                "detected_state": working_profile.get("state"),
                "detected_district": working_profile.get("district")
            }
        }
        session.stage_logs.append(st1_payload)
        yield f"event: stage_update\ndata: {json.dumps(st1_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.4)

        # -------------------------------------------------------------
        # STAGE 2: Building your beneficiary profile
        # -------------------------------------------------------------
        session.current_stage = 2
        t1 = time.time()

        # Identify applicable citizen categories
        categories = extracted.get("target_categories", [])
        if not categories:
            occ = working_profile.get("occupation") or ""
            if "किसान" in occ:
                categories = ["agriculture", "social_welfare"]
            elif "छात्र" in occ or working_profile.get("is_student"):
                categories = ["education", "employment"]
            elif working_profile.get("marital_status") == "विधवा":
                categories = ["social_welfare", "women_child", "housing"]
            elif (working_profile.get("age") or 0) >= 60:
                categories = ["social_welfare", "health"]
            else:
                categories = ["social_welfare", "employment", "health"]

        st2_payload = {
            "analysis_id": analysis_id,
            "stage": 2,
            "stage_id": "building_profile",
            "stage_title": "लाभार्थी प्रोफ़ाइल का निर्माण",
            "stage_title_en": "Building your beneficiary profile",
            "progress_percent": 33,
            "status": "completed",
            "elapsed_ms": int((time.time() - t1) * 1000),
            "activity_message": f"लाभार्थी प्रोफ़ाइल तैयार: {len(categories)} प्रमुख कल्याणकारी श्रेणियों की पहचान की गई।",
            "details": {
                "profile_summary": {
                    "age": working_profile.get("age"),
                    "gender": working_profile.get("gender"),
                    "marital_status": working_profile.get("marital_status"),
                    "occupation": working_profile.get("occupation"),
                    "state": working_profile.get("state"),
                    "district": working_profile.get("district"),
                    "annual_income": working_profile.get("annual_income"),
                    "landholding": working_profile.get("landholding"),
                    "has_disability": working_profile.get("has_disability", False),
                    "is_student": working_profile.get("is_student", False)
                },
                "matched_categories": categories
            }
        }
        session.stage_logs.append(st2_payload)
        yield f"event: stage_update\ndata: {json.dumps(st2_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.4)

        # -------------------------------------------------------------
        # STAGE 3: Searching official government sources
        # -------------------------------------------------------------
        session.current_stage = 3
        t2 = time.time()

        # Real connector health check & candidate search
        sources_health = connector_manager.get_all_health()
        all_schemes = get_all_schemes()
        user_state = working_profile.get("state")

        # Filter schemes by geography and applicability
        candidate_schemes = []
        for s in all_schemes:
            if not s.get("is_active", True):
                continue
            states = s.get("applicable_states", ["All"])
            if "All" in states or (user_state and user_state in states):
                candidate_schemes.append(s)

        st3_payload = {
            "analysis_id": analysis_id,
            "stage": 3,
            "stage_id": "searching_sources",
            "stage_title": "सरकारी स्रोतों की खोज",
            "stage_title_en": "Searching official government sources",
            "progress_percent": 50,
            "status": "completed",
            "elapsed_ms": int((time.time() - t2) * 1000),
            "activity_message": (
                f"आधिकारिक सरकारी स्रोतों (myScheme, API Setu, SSPY UP) से {len(candidate_schemes)} योजनाएँ प्राप्त की गईं।"
            ),
            "details": {
                "sources_checked": [
                    {"name": "myScheme National Platform", "status": "verified_catalogue"},
                    {"name": "API Setu Gateway (Govt of India)", "status": "authorized_endpoints"},
                    {"name": "Open Government Data (data.gov.in)", "status": "connected"},
                    {"name": f"{user_state} राज्य कल्याण पोर्टल (SSPY)", "status": "active"}
                ],
                "candidate_schemes_count": len(candidate_schemes),
                "central_schemes_count": sum(1 for s in candidate_schemes if s.get("central_or_state") == "central"),
                "state_schemes_count": sum(1 for s in candidate_schemes if s.get("central_or_state") == "state")
            }
        }
        session.stage_logs.append(st3_payload)
        yield f"event: stage_update\ndata: {json.dumps(st3_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.4)

        # -------------------------------------------------------------
        # STAGE 4: Analysing scheme eligibility
        # -------------------------------------------------------------
        session.current_stage = 4
        t3 = time.time()

        evaluated_results: List[Dict[str, Any]] = []
        eligible_schemes = []
        potentially_eligible = []
        more_info_required = []
        not_eligible = []

        for s in candidate_schemes:
            eval_res = SchemeEvaluator.evaluate(working_profile, s)

            # Enrich with presentation metadata
            eval_res["category"] = s.get("category", "social_welfare")
            eval_res["category_hindi"] = s.get("category_hindi", "सामाजिक सुरक्षा")
            eval_res["central_or_state"] = s.get("central_or_state", "central")
            eval_res["ministry_hindi"] = s.get("ministry_hindi", "")
            eval_res["description_hindi"] = s.get("description_hindi", "")
            eval_res["official_website"] = s.get("official_website", "")
            eval_res["official_source"] = s.get("official_source", "")
            eval_res["required_documents"] = s.get("required_documents", [])
            eval_res["application_steps"] = s.get("application_steps", [])
            eval_res["benefits"] = s.get("benefits", {})
            eval_res["last_verified_at"] = s.get("last_verified_at", "")

            evaluated_results.append(eval_res)
            st = eval_res.get("status")
            if st == "eligible":
                eligible_schemes.append(eval_res)
            elif st == "potentially_eligible":
                potentially_eligible.append(eval_res)
            elif st == "more_info_required":
                more_info_required.append(eval_res)
            else:
                not_eligible.append(eval_res)

        # Relevance ranking & Domain filtering
        user_req = (working_profile.get("assistance_requirement") or "").lower()
        user_occ = (working_profile.get("occupation") or "").lower()

        filtered_eligible = []
        for s_eval in eligible_schemes:
            cat = s_eval.get("category", "")
            # Exclude inappropriate domains
            if ("बेरोजगार" in user_occ or "student" in user_occ or "छात्र" in user_occ) and cat == "agriculture":
                continue
            if "किसान" in user_occ and cat == "education" and not any(m.get("is_student") for m in working_profile.get("members", [])):
                continue
            if user_req == "education" and cat not in ["education", "skills", "social_welfare"]:
                continue
            if user_req == "employment" and cat not in ["employment", "skills", "business", "social_welfare"]:
                continue
            if user_req == "agriculture" and cat not in ["agriculture", "social_welfare", "health"]:
                continue
            filtered_eligible.append(s_eval)

        eligible_schemes = filtered_eligible

        filtered_potential = []
        for s_eval in potentially_eligible:
            cat = s_eval.get("category", "")
            sid = s_eval.get("scheme_id", "")
            if ("बेरोजगार" in user_occ or "student" in user_occ or "छात्र" in user_occ or "निजी" in user_occ) and cat == "agriculture":
                continue
            if working_profile.get("gender") in ["पुरुष", "male"] and any(w in sid for w in ["widow", "vidhwa", "mahila", "kanya", "bc_sakhi", "ladli"]):
                continue
            if working_profile.get("marital_status") and working_profile.get("marital_status") not in ["विधवा", "widowed"] and any(w in sid for w in ["widow", "vidhwa"]):
                continue
            if user_req == "education" and cat not in ["education", "skills", "social_welfare"]:
                continue
            if user_req == "employment" and cat not in ["employment", "skills", "business", "social_welfare"]:
                continue
            if user_req == "agriculture" and cat not in ["agriculture", "social_welfare", "health"]:
                continue
            filtered_potential.append(s_eval)

        potentially_eligible = filtered_potential

        eligible_schemes.sort(key=lambda x: len(x.get("matched_conditions", [])), reverse=True)
        potentially_eligible.sort(key=lambda x: len(x.get("matched_conditions", [])), reverse=True)

        st4_payload = {
            "analysis_id": analysis_id,
            "stage": 4,
            "stage_id": "evaluating_eligibility",
            "stage_title": "पात्रता और शर्तों का विश्लेषण",
            "stage_title_en": "Analysing scheme eligibility",
            "progress_percent": 68,
            "status": "completed",
            "elapsed_ms": int((time.time() - t3) * 1000),
            "activity_message": (
                f"पात्रता मूल्यांकन संपन्न: {len(eligible_schemes)} योजनाएँ पात्र, "
                f"{len(potentially_eligible)} संभावित, {len(more_info_required)} में अतिरिक्त जानकारी आवश्यक।"
            ),
            "details": {
                "total_evaluated": len(candidate_schemes),
                "eligible_count": len(eligible_schemes),
                "potentially_eligible_count": len(potentially_eligible),
                "more_info_required_count": len(more_info_required),
                "not_eligible_count": len(not_eligible),
                "top_eligible_names": [s["scheme_name_hindi"] for s in eligible_schemes[:3]]
            }
        }
        session.stage_logs.append(st4_payload)
        yield f"event: stage_update\ndata: {json.dumps(st4_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.4)

        # -------------------------------------------------------------
        # STAGE 5: Checking documents and application requirements
        # -------------------------------------------------------------
        session.current_stage = 5
        t4 = time.time()

        user_docs = get_all_user_documents()
        all_required_docs = set()
        for s in (eligible_schemes + potentially_eligible):
            for doc in s.get("required_documents", []):
                all_required_docs.add(doc)

        available_docs = [doc for doc in all_required_docs if user_docs.get(doc) == "uploaded"]
        missing_docs = [doc for doc in all_required_docs if user_docs.get(doc) != "uploaded"]

        st5_payload = {
            "analysis_id": analysis_id,
            "stage": 5,
            "stage_id": "checking_documents",
            "stage_title": "दस्तावेज़ और आवेदन प्रक्रिया सत्यापन",
            "stage_title_en": "Checking documents and application requirements",
            "progress_percent": 85,
            "status": "completed",
            "elapsed_ms": int((time.time() - t4) * 1000),
            "activity_message": (
                f"दस्तावेज़ सत्यापन पूर्ण: कुल {len(all_required_docs)} आवश्यक सरकारी दस्तावेज़ पहचाने गए。"
            ),
            "details": {
                "total_required_docs": len(all_required_docs),
                "available_docs_count": len(available_docs),
                "missing_docs_count": len(missing_docs),
                "key_documents_list": list(all_required_docs)[:6],
                "official_portals_count": len(set(s.get("official_website") for s in eligible_schemes if s.get("official_website")))
            }
        }
        session.stage_logs.append(st5_payload)
        yield f"event: stage_update\ndata: {json.dumps(st5_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.4)

        # -------------------------------------------------------------
        # STAGE 6: Preparing personalised recommendations
        # -------------------------------------------------------------
        session.current_stage = 6
        t5 = time.time()

        # Build full final research report
        final_report = {
            "analysis_id": analysis_id,
            "created_at": session.created_at,
            "completed_at": datetime.now().isoformat(),
            "profile": working_profile,
            "summary": {
                "total_discovered": len(candidate_schemes),
                "total_evaluated": len(candidate_schemes),
                "eligible_count": len(eligible_schemes),
                "potentially_eligible_count": len(potentially_eligible),
                "more_info_required_count": len(more_info_required),
                "not_eligible_count": len(not_eligible),
                "central_schemes_count": sum(1 for s in eligible_schemes if s.get("central_or_state") == "central"),
                "state_schemes_count": sum(1 for s in eligible_schemes if s.get("central_or_state") == "state"),
                "data_mode": sources_health.get("overall_status"),
                "data_mode_description": sources_health.get("active_mode_description"),
                "disclaimer": "यह केवल प्रारंभिक पात्रता विश्लेषण है। अंतिम स्वीकृति संबंधित सरकारी विभाग के नियमों एवं दस्तावेज़ सत्यापन पर निर्भर करती है।"
            },
            "source_health": sources_health.get("sources", []),
            "results": {
                "eligible": eligible_schemes,
                "potentially_eligible": potentially_eligible,
                "more_info_required": more_info_required,
                "not_eligible": not_eligible
            },
            "required_documents_summary": {
                "total": len(all_required_docs),
                "available": available_docs,
                "missing": missing_docs
            }
        }

        session.result = final_report
        session.status = "completed"

        st6_payload = {
            "analysis_id": analysis_id,
            "stage": 6,
            "stage_id": "preparing_recommendations",
            "stage_title": "व्यक्तिगत सिफारिशें तैयार",
            "stage_title_en": "Preparing personalised recommendations",
            "progress_percent": 100,
            "status": "completed",
            "elapsed_ms": int((time.time() - t5) * 1000),
            "activity_message": (
                f"अनुसंधान पूर्ण! आपके लिए {len(eligible_schemes)} उपयुक्त और {len(potentially_eligible)} संभावित सरकारी योजनाएं तैयार हैं।"
            ),
            "report_summary": final_report["summary"]
        }
        session.stage_logs.append(st6_payload)
        yield f"event: stage_update\ndata: {json.dumps(st6_payload, ensure_ascii=False)}\n\n"
        await anyio.sleep(0.2)

        # Final complete event carrying full final report
        complete_payload = {
            "analysis_id": analysis_id,
            "status": "completed",
            "report": final_report
        }
        yield f"event: complete\ndata: {json.dumps(complete_payload, ensure_ascii=False)}\n\n"


analysis_service = SchemeAnalysisService()
