"""
Sarkari Saathi Python Rule Engine Evaluator.
Deterministic evaluation of government scheme eligibility without hallucinations.
"""
from typing import Any, Dict, List, Optional
from app.rule_engine.conditions import (
    evaluate_age,
    evaluate_gender,
    evaluate_marital_status,
    evaluate_state,
    evaluate_income,
    evaluate_occupation,
    evaluate_landholding,
    evaluate_student,
    evaluate_disability,
    evaluate_caste,
    evaluate_area_type,
    evaluate_exclusions,
)


class SchemeEvaluator:
    """
    Deterministic rule engine that checks a user/family profile against
    structured scheme eligibility conditions.
    """

    @staticmethod
    def evaluate(profile: Dict[str, Any], scheme: Dict[str, Any]) -> Dict[str, Any]:
        conditions = scheme.get("eligibility_conditions", {}) or {}
        matched = []
        unmatched = []
        missing = []
        explanations = []

        # 1. State check
        if "states" in conditions or scheme.get("applicable_states"):
            allowed_states = conditions.get("states") or scheme.get("applicable_states")
            st_status, st_reason = evaluate_state(profile.get("state"), allowed_states)
            if st_status == "matched":
                matched.append("state")
            elif st_status == "unmatched":
                unmatched.append("state")
                explanations.append(st_reason)
            elif st_status == "missing":
                missing.append("state")
                explanations.append(st_reason)

        # 2. Age check
        min_age = conditions.get("min_age")
        max_age = conditions.get("max_age")
        if min_age is not None or max_age is not None:
            age_status, age_reason = evaluate_age(profile.get("age"), min_age, max_age)
            if age_status == "matched":
                matched.append("age")
            elif age_status == "unmatched":
                unmatched.append("age")
                explanations.append(age_reason)
            elif age_status == "missing":
                missing.append("age")
                explanations.append(age_reason)

        # 3. Gender check
        if "gender" in conditions:
            gen_status, gen_reason = evaluate_gender(profile.get("gender"), conditions["gender"])
            if gen_status == "matched":
                matched.append("gender")
            elif gen_status == "unmatched":
                unmatched.append("gender")
                explanations.append(gen_reason)
            elif gen_status == "missing":
                missing.append("gender")
                explanations.append(gen_reason)

        # 4. Marital status check
        if "marital_status" in conditions:
            mar_status, mar_reason = evaluate_marital_status(profile.get("marital_status"), conditions["marital_status"])
            if mar_status == "matched":
                matched.append("marital_status")
            elif mar_status == "unmatched":
                unmatched.append("marital_status")
                explanations.append(mar_reason)
            elif mar_status == "missing":
                missing.append("marital_status")
                explanations.append(mar_reason)

        # 5. Income check
        max_income = conditions.get("max_annual_income")
        if max_income is not None:
            inc_status, inc_reason = evaluate_income(profile.get("annual_income"), max_income)
            if inc_status == "matched":
                matched.append("annual_income")
            elif inc_status == "unmatched":
                unmatched.append("annual_income")
                explanations.append(inc_reason)
            elif inc_status == "missing":
                missing.append("annual_income")
                explanations.append(inc_reason)

        # 6. Occupation check
        if "occupation" in conditions:
            occ_status, occ_reason = evaluate_occupation(profile.get("occupation"), conditions["occupation"])
            if occ_status == "matched":
                matched.append("occupation")
            elif occ_status == "unmatched":
                unmatched.append("occupation")
                explanations.append(occ_reason)
            elif occ_status == "missing":
                missing.append("occupation")
                explanations.append(occ_reason)

        # 7. Landholding check
        if conditions.get("has_landholding"):
            land_status, land_reason = evaluate_landholding(True, profile.get("landholding"))
            if land_status == "matched":
                matched.append("landholding")
            elif land_status == "unmatched":
                unmatched.append("landholding")
                explanations.append(land_reason)
            elif land_status == "missing":
                missing.append("landholding")
                explanations.append(land_reason)

        # 8. Daughter check for girl child schemes
        if conditions.get("has_daughter"):
            # Check family members
            members = profile.get("members", [])
            has_daughter = any("पुत्री" in m.get("relationship", "") or "बेटी" in m.get("relationship", "") for m in members)
            if has_daughter:
                matched.append("has_daughter")
            else:
                missing.append("has_daughter")
                explanations.append("परिवार में बालिका/पुत्री की जानकारी आवश्यक है।")

        # 9. Pregnancy / lactating check
        if conditions.get("is_pregnant_or_lactating"):
            missing.append("is_pregnant_or_lactating")
            explanations.append("गर्भावस्था या हालिया प्रसव की जानकारी का सत्यापन आवश्यक है।")

        # 10. Student check (applicant or children in family)
        if conditions.get("is_student"):
            has_student = profile.get("is_student", False)
            if not has_student:
                # Check family members for students or school-age children (6-22)
                members = profile.get("members", [])
                has_student = any(
                    "छात्र" in m.get("occupation", "").lower() or
                    "विद्यार्थी" in m.get("occupation", "").lower() or
                    "student" in m.get("occupation", "").lower() or
                    (m.get("relationship") in ["पुत्र", "पुत्री", "बेटा", "बेटी", "बच्चा"] and 6 <= m.get("age", 0) <= 22)
                    for m in members
                )
            if has_student:
                matched.append("is_student")
            elif profile.get("is_student") is None and not profile.get("members"):
                missing.append("is_student")
                explanations.append("परिवार में अध्ययनरत छात्र/विद्यार्थी होने की जानकारी आवश्यक है।")
            else:
                unmatched.append("is_student")
                explanations.append("यह छात्रवृत्ति योजना अध्ययनरत विद्यार्थियों के लिए है।")

        # 11. Disability check
        if conditions.get("has_disability"):
            dis_status, dis_reason = evaluate_disability(profile.get("has_disability"), True, conditions.get("min_disability_percent", 40))
            if dis_status == "matched":
                matched.append("has_disability")
            elif dis_status == "unmatched":
                unmatched.append("has_disability")
                explanations.append(dis_reason)
            elif dis_status == "missing":
                missing.append("has_disability")
                explanations.append(dis_reason)

        # 12. Social category / Caste check
        if conditions.get("caste_categories"):
            caste_status, caste_reason = evaluate_caste(profile.get("caste_category"), conditions["caste_categories"])
            if caste_status == "matched":
                matched.append("caste_category")
            elif caste_status == "unmatched":
                unmatched.append("caste_category")
                explanations.append(caste_reason)
            elif caste_status == "missing":
                missing.append("caste_category")
                explanations.append(caste_reason)

        # 13. Area type check (Rural / Urban)
        if conditions.get("area_type"):
            user_area = profile.get("area_type") or ("ग्रामीण" if profile.get("village_or_town") else None)
            area_status, area_reason = evaluate_area_type(user_area, conditions["area_type"])
            if area_status == "matched":
                matched.append("area_type")
            elif area_status == "unmatched":
                unmatched.append("area_type")
                explanations.append(area_reason)
            elif area_status == "missing":
                missing.append("area_type")
                explanations.append(area_reason)

        # 14. Exclusions check
        if scheme.get("exclusions"):
            excl_status, excl_reason = evaluate_exclusions(profile, scheme["exclusions"])
            if excl_status == "unmatched":
                unmatched.append("exclusions")
                explanations.append(excl_reason)

        # Determine overall status across 4 official outcomes:
        # A. eligible (All known mandatory conditions satisfied)
        # B. potentially_eligible (Qualifies fundamentally, but needs certificate / family verification)
        # C. not_eligible (At least one confirmed mandatory condition failed)
        # D. more_info_required (Missing critical profile information to assess)
        if len(unmatched) > 0:
            status = "not_eligible"
            main_explanation = " ".join(explanations) or "योजना की कुछ मुख्य पात्रता शर्तें पूरी नहीं होती हैं।"
        elif len(missing) >= 3 and len(matched) <= 1:
            status = "more_info_required"
            main_explanation = "पात्रता विश्लेषण के लिए अधिक जानकारी की आवश्यकता है: " + " ".join(explanations)
        elif len(missing) > 0:
            status = "potentially_eligible"
            main_explanation = " ".join(explanations) or "प्राथमिक शर्तें अनुकूल हैं। दस्तावेज़ सत्यापन उपरांत अंतिम पात्रता तय होगी।"
        else:
            status = "eligible"
            reasons = []
            if "marital_status" in matched:
                reasons.append("आपकी वैवाहिक स्थिति अनुकूल है")
            if "age" in matched:
                reasons.append(f"आपकी उम्र {profile.get('age', '')} वर्ष अनुकूल है")
            if "occupation" in matched or "landholding" in matched:
                reasons.append("आपका किसान/कृषक परिवार से संबंध है")
            if "annual_income" in matched:
                reasons.append("आपकी पारिवारिक आय तय सीमा के भीतर है")
            if "state" in matched:
                reasons.append(f"आप {profile.get('state', '')} के निवासी हैं")
            if "is_student" in matched:
                reasons.append("परिवार में अध्ययनरत विद्यार्थी हैं")

            if reasons:
                main_explanation = "आपकी " + " और ".join(reasons) + "।"
            else:
                main_explanation = "आप इस योजना की सभी प्राथमिक शर्तें पूरी करते हैं।"

        return {
            "scheme_id": scheme.get("id"),
            "scheme_name": scheme.get("scheme_name"),
            "scheme_name_hindi": scheme.get("scheme_name_hindi"),
            "department_hindi": scheme.get("department_hindi"),
            "benefits": scheme.get("benefits"),
            "status": status,
            "matched_conditions": matched,
            "unmatched_conditions": unmatched,
            "missing_information": missing,
            "explanation": main_explanation,
            "official_source": scheme.get("official_source") or scheme.get("official_website"),
            "official_website": scheme.get("official_website"),
            "last_verified_at": scheme.get("last_verified_at", "2024-11-01"),
            "disclaimer": "यह केवल प्रारंभिक पात्रता विश्लेषण है। अंतिम स्वीकृति संबंधित सरकारी विभाग द्वारा सत्यापन के बाद ही मान्य होगी।",
            "rule_version": "2.0",
        }

