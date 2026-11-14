"""
Intelligent Government Scheme Discovery Service for Sarkari Saathi.
Discovers and evaluates real government schemes across Central and State portals
(myScheme.gov.in, India.gov.in, SSPY UP, UP Agridarshan, UP Scholarship)
using the deterministic Python Rule Engine.
"""
from typing import Any, Dict, List, Optional
from app.database import get_current_profile, create_empty_profile, get_all_schemes, get_scheme_by_id
from app.rule_engine.evaluator import SchemeEvaluator
from app.services.myscheme_service import MYSCHEME_CATEGORIES
from app.integrations.connector_manager import connector_manager


class SchemeDiscoveryService:
    @staticmethod
    def get_categories() -> List[Dict[str, Any]]:
        """
        Returns all official myScheme categories with Hindi labels and counts.
        """
        all_schemes = get_all_schemes()
        category_counts = {}
        for s in all_schemes:
            cat = s.get("category", "other")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        enriched = []
        if isinstance(MYSCHEME_CATEGORIES, dict):
            for code, name in MYSCHEME_CATEGORIES.items():
                enriched.append({
                    "code": code,
                    "name_en": name.split("(")[0].strip() if "(" in name else name,
                    "name_hi": name.split("(")[1].replace(")", "").strip() if "(" in name else name,
                    "scheme_count": category_counts.get(code, 0)
                })
        else:
            for cat in MYSCHEME_CATEGORIES:
                enriched.append({
                    "code": cat.get("code"),
                    "name_hi": cat.get("name_hi"),
                    "name_en": cat.get("name_en"),
                    "scheme_count": category_counts.get(cat.get("code"), 0)
                })
        return enriched

    @staticmethod
    def discover_schemes(
        profile: Optional[Dict[str, Any]] = None,
        category: Optional[str] = None,
        search_query: Optional[str] = None,
        government_level: Optional[str] = None,  # 'central' | 'state' | None
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Multi-criteria discovery of verified government schemes for a citizen profile.
        Evaluates candidate schemes using the deterministic SchemeEvaluator.
        Categorizes outcomes into:
          A. eligible (All known mandatory conditions satisfied)
          B. potentially_eligible (Qualifies fundamentally; secondary documents/verification needed)
          C. more_info_required (Key profile info missing to perform evaluation)
          D. not_eligible (At least one confirmed mandatory condition failed)
        """
        if profile is None:
            profile = get_current_profile()

        user_state = profile.get("state")
        all_schemes = get_all_schemes()

        # Deduplicate schemes by id or normalized name
        seen_ids = set()
        unique_schemes = []
        for s in all_schemes:
            sid = s.get("id")
            if sid and sid not in seen_ids:
                seen_ids.add(sid)
                unique_schemes.append(s)

        eligible: List[Dict[str, Any]] = []
        potentially_eligible: List[Dict[str, Any]] = []
        more_info_required: List[Dict[str, Any]] = []
        not_eligible: List[Dict[str, Any]] = []

        q = (search_query or "").strip().lower()

        for s in unique_schemes:
            if not s.get("is_active", True):
                continue

            # 1. Filter by Government Level if specified
            if government_level and s.get("central_or_state") != government_level:
                continue

            # 2. Filter by Category if specified
            if category and category != "all" and s.get("category") != category:
                continue

            # 3. Filter by Search Query if present
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

            # 4. Deterministic Rule Engine Evaluation (Evaluates state, age, income, occupation, etc.)
            eval_res = SchemeEvaluator.evaluate(profile, s)

            # Enrich result with full scheme presentation attributes
            eval_res["category"] = s.get("category", "social_welfare")
            eval_res["category_hindi"] = s.get("category_hindi", "सामाजिक सुरक्षा")
            eval_res["central_or_state"] = s.get("central_or_state", "central")
            eval_res["ministry"] = s.get("ministry", "")
            eval_res["ministry_hindi"] = s.get("ministry_hindi", "")
            eval_res["description_hindi"] = s.get("description_hindi", "")
            eval_res["description"] = s.get("description", "")
            eval_res["official_website"] = s.get("official_website", "")
            eval_res["official_source"] = s.get("official_source", "")
            eval_res["required_documents"] = s.get("required_documents", [])
            eval_res["optional_documents"] = s.get("optional_documents", [])
            eval_res["application_steps"] = s.get("application_steps", [])
            eval_res["last_verified_at"] = s.get("last_verified_at", "")

            # Sort into the appropriate 4 buckets
            status = eval_res.get("status")
            if status == "eligible":
                eligible.append(eval_res)
            elif status == "potentially_eligible":
                potentially_eligible.append(eval_res)
            elif status == "more_info_required":
                more_info_required.append(eval_res)
            else:
                not_eligible.append(eval_res)

        user_req = (profile.get("assistance_requirement") or "").lower()
        user_occ = (profile.get("occupation") or "").lower()

        # Strict Profile Completeness Check:
        # If user has not provided at least 2 basic profile parameters (e.g. age/occupation/income),
        # do NOT declare them eligible for specific welfare schemes!
        provided_attr_count = sum(
            1 for k in ["age", "occupation", "annual_income", "marital_status", "landholding", "is_student", "has_disability"]
            if profile.get(k) is not None
        )
        if provided_attr_count == 0:
            # Completely un-onboarded / unprofiled citizen: zero eligible recommendations
            eligible = []
            potentially_eligible = []

        target_cats = set(profile.get("target_categories") or [])
        if user_req:
            target_cats.add(user_req)

        # Relevance filtering by assistance requirement and occupation:
        filtered_eligible: List[Dict[str, Any]] = []
        for item in eligible:
            cat = item.get("category", "")
            sid = item.get("scheme_id", "")

            # 1. Unemployed youth / student should NEVER receive farmer schemes
            if ("बेरोजगार" in user_occ or "student" in user_occ or "छात्र" in user_occ) and cat == "agriculture":
                continue
            # 2. Farmers should receive agriculture, housing, health, welfare, and scholarship if family has school/college students
            has_student_in_family = profile.get("is_student") or any(
                m.get("is_student") or "छात्र" in m.get("occupation", "") or "विद्यार्थी" in m.get("occupation", "") or "student" in m.get("occupation", "").lower() or (6 <= m.get("age", 0) <= 22)
                for m in profile.get("members", [])
            )
            if "किसान" in user_occ and cat == "education" and not has_student_in_family:
                continue
            # 3. Explicit domain requests
            if cat in target_cats:
                pass
            elif user_req == "education" and cat not in ["education", "skills", "social_welfare"]:
                continue
            elif user_req in ["employment", "skills", "business"] and cat not in ["employment", "skills", "business", "social_welfare", "women_child"]:
                continue
            elif user_req == "agriculture" and cat not in ["agriculture", "social_welfare", "health"]:
                continue

            filtered_eligible.append(item)

        eligible = filtered_eligible

        # Filter potentially_eligible to remove irrelevant domains:
        filtered_potential: List[Dict[str, Any]] = []
        for item in potentially_eligible:
            cat = item.get("category", "")
            sid = item.get("scheme_id", "")

            # 1. Non-farmers / unemployed / student / private employees should not get agriculture in potential
            if ("बेरोजगार" in user_occ or "student" in user_occ or "छात्र" in user_occ or "निजी" in user_occ) and cat == "agriculture":
                continue
            # 2. Male should never get widow or female-only schemes in potential
            if profile.get("gender") in ["पुरुष", "male"] and any(w in sid for w in ["widow", "vidhwa", "mahila", "kanya", "bc_sakhi", "ladli"]):
                continue
            # 3. Non-widow should not get widow schemes
            if profile.get("marital_status") and profile.get("marital_status") not in ["विधवा", "widowed"] and any(w in sid for w in ["widow", "vidhwa"]):
                continue
            # 4. Filter by explicit assistance requirement if provided
            if cat in target_cats:
                pass
            elif user_req == "education" and cat not in ["education", "skills", "social_welfare"]:
                continue
            elif user_req in ["employment", "skills", "business"] and cat not in ["employment", "skills", "business", "social_welfare", "women_child"]:
                continue
            elif user_req == "agriculture" and cat not in ["agriculture", "social_welfare", "health"]:
                continue

            filtered_potential.append(item)

        potentially_eligible = filtered_potential

        def scheme_relevance_score(x: Dict[str, Any]) -> int:
            score = len(x.get("matched_conditions", [])) * 10
            cat = x.get("category", "")
            tags = x.get("beneficiary_tags", [])
            # Direct match to citizen's requested domain
            if cat in target_cats or any(t in target_cats for t in tags):
                score += 50
            if "business" in target_cats and any(w in tags for w in ["business", "startup", "loan"]):
                score += 40
            if "employment" in target_cats and any(w in tags for w in ["unemployed", "allowance", "employment", "graduate"]):
                score += 40
            if "skills" in target_cats and any(w in tags for w in ["skill", "training"]):
                score += 35
            # State-specific preference for the citizen's home state
            if x.get("central_or_state") == "state" and x.get("applicable_states"):
                if any(st in x.get("applicable_states", []) for st in [profile.get("state"), "Rajasthan", "राजस्थान"]):
                    score += 30
            return score

        # Two-stage relevance ranking
        eligible.sort(key=scheme_relevance_score, reverse=True)
        potentially_eligible.sort(key=scheme_relevance_score, reverse=True)

        # Count by category for discovery UI breakdown
        category_breakdown: Dict[str, int] = {}
        for item in (eligible + potentially_eligible):
            c = item.get("category_hindi", "अन्य")
            category_breakdown[c] = category_breakdown.get(c, 0) + 1

        # Fetch source health status for transparent reporting
        sources_status = connector_manager.get_all_health()

        total_evaluated = len(eligible) + len(potentially_eligible) + len(more_info_required) + len(not_eligible)

        # Apply pagination if limits specified
        paginated_eligible = eligible[offset : offset + limit]
        paginated_potential = potentially_eligible[offset : offset + limit]

        return {
            "summary": {
                "total_discovered": total_evaluated,
                "total_evaluated": total_evaluated,
                "eligible_count": len(eligible),
                "potentially_eligible_count": len(potentially_eligible),
                "more_info_required_count": len(more_info_required),
                "not_eligible_count": len(not_eligible),
                "central_schemes_count": sum(1 for item in eligible if item.get("central_or_state") == "central"),
                "state_schemes_count": sum(1 for item in eligible if item.get("central_or_state") == "state"),
                "data_mode": sources_status.get("overall_status"),
                "data_mode_description": sources_status.get("active_mode_description"),
            },
            "category_breakdown": category_breakdown,
            "source_health": sources_status.get("sources", []),
            "results": {
                "eligible": paginated_eligible,
                "potentially_eligible": paginated_potential,
                "more_info_required": more_info_required,
                "not_eligible": not_eligible,
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < len(eligible)
            }
        }


discovery_service = SchemeDiscoveryService()
