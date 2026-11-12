"""
Eligibility Evaluation Service for Sarkari Saathi.
Runs deterministic Python rule engine evaluations on all active schemes.
"""
from typing import Any, Dict, List
from app.database import get_current_profile, get_all_schemes
from app.rule_engine.evaluator import SchemeEvaluator


class EligibilityService:
    @staticmethod
    def evaluate_all_schemes(profile: Dict[str, Any] = None) -> Dict[str, Any]:
        if profile is None:
            profile = get_current_profile()

        schemes = get_all_schemes()
        eligible: List[Dict[str, Any]] = []
        potentially_eligible: List[Dict[str, Any]] = []
        not_eligible: List[Dict[str, Any]] = []

        for s in schemes:
            if not s.get("is_active", True):
                continue

            res = SchemeEvaluator.evaluate(profile, s)
            res["category"] = s.get("category", "social_welfare")
            res["category_hindi"] = s.get("category_hindi", "सामाजिक सुरक्षा")
            res["central_or_state"] = s.get("central_or_state", "central")
            res["ministry"] = s.get("ministry", "")
            res["ministry_hindi"] = s.get("ministry_hindi", "")
            res["description_hindi"] = s.get("description_hindi", "")
            res["description"] = s.get("description", "")
            res["official_website"] = s.get("official_website", "")
            res["official_source"] = s.get("official_source", "")
            res["required_documents"] = s.get("required_documents", [])
            res["optional_documents"] = s.get("optional_documents", [])
            res["application_steps"] = s.get("application_steps", [])
            res["last_verified_at"] = s.get("last_verified_at", "")

            if res["status"] == "eligible":
                eligible.append(res)
            elif res["status"] == "potentially_eligible":
                potentially_eligible.append(res)
            else:
                not_eligible.append(res)

        return {
            "summary": {
                "total": len(schemes),
                "eligible_count": len(eligible),
                "potentially_eligible_count": len(potentially_eligible),
                "not_eligible_count": len(not_eligible)
            },
            "results": {
                "eligible": eligible,
                "potentially_eligible": potentially_eligible,
                "not_eligible": not_eligible
            }
        }


eligibility_service = EligibilityService()
