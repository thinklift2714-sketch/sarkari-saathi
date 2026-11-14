"""
Sarkari Saathi Python Rule Engine Evaluator.
Deterministic evaluation of government scheme eligibility without hallucinations.
Implements strict 5-status evaluation:
- ELIGIBLE
- POTENTIALLY_ELIGIBLE
- NOT_ELIGIBLE
- MORE_INFORMATION_REQUIRED
- NOT_ENOUGH_EVIDENCE
"""
from typing import Any, Dict, List, Optional
from app.rule_engine.conditions import (
    evaluate_age,
    evaluate_gender,
    evaluate_marital_status,
    evaluate_state,
    evaluate_income,
    evaluate_occupation,
    evaluate_education,
    evaluate_landholding,
    evaluate_student,
    evaluate_disability,
    evaluate_caste,
    evaluate_area_type,
    evaluate_exclusions,
)


class SchemeEvaluator:
    """
    Deterministic rule engine that checks a citizen profile against
    structured scheme eligibility conditions.
    Never assumes missing information is satisfied.
    """

    @staticmethod
    def evaluate(profile: Dict[str, Any], scheme: Dict[str, Any]) -> Dict[str, Any]:
        conditions = scheme.get("eligibility_conditions") or scheme.get("eligibility_criteria") or {}
        matched = []
        unmatched = []
        missing = []
        explanations = []
        evidence = {}

        # -------------------------------------------------------------
        # 0. Domain & Category Compatibility Check
        # -------------------------------------------------------------
        scheme_cat = scheme.get("category") or ""
        scheme_id = scheme.get("id") or ""
        profile_occ = (profile.get("occupation") or "").lower()
        req = (profile.get("assistance_requirement") or "").lower()
        user_age = profile.get("age")
        user_gender = profile.get("gender")
        user_marital = profile.get("marital_status")

        # Disqualify schemes that strictly contradict user's stated occupation/domain:
        # A. Agriculture Schemes (e.g. PM Kisan, KCC, Solar Pump, Crop Insurance)
        if scheme_cat in ["agriculture", "कृषि"] or "kisan" in scheme_id or "farmer" in scheme_id or "krishi" in scheme_id or "fby" in scheme_id:
            owns_land = profile.get("owns_agricultural_land")
            landholding = profile.get("landholding")
            is_landless = (owns_land is False) or (landholding is not None and landholding == 0.0)
            is_non_farmer = any(w in profile_occ for w in ["बेरोजगार", "student", "छात्र", "निजी", "private", "सरकारी", "दुकानदार"])

            if is_non_farmer:
                if "occupation" not in unmatched:
                    unmatched.append("occupation")
                explanations.append("यह योजना कृषकों/किसानों के लिए है, जबकि आपकी स्थिति गैर-कृषि है।")
                evidence["occupation"] = f"Profile occupation is {profile.get('occupation')}"
            elif is_landless and scheme_id in ["scheme_pm_kisan", "scheme_pmfby", "scheme_kcc", "scheme_up_krishi_yantra", "scheme_soil_health_card", "scheme_pkvy"]:
                if "landholding" not in unmatched:
                    unmatched.append("landholding")
                explanations.append("इस योजना के लिए स्वयं के नाम पर कृषि भूमि होना अनिवार्य है।")
                evidence["landholding"] = "Applicant owns 0.0 acres (family/father land does not qualify applicant)"

        # B. Pension & Bereavement Schemes (Widow Pension, NFBS, Old Age Pension)
        if "widow_pension" in scheme_id or "vidhwa" in scheme_id or scheme_id == "scheme_nfbs":
            if user_marital and user_marital not in ["विधवा", "widowed", "widow"]:
                if "marital_status" not in unmatched:
                    unmatched.append("marital_status")
                explanations.append("यह योजना केवल निराश्रित / विधवा महिलाओं के लिए है।")
                evidence["marital_status"] = f"Marital status is {user_marital}"
            if user_gender and user_gender in ["पुरुष", "male", "purush"]:
                if "gender" not in unmatched:
                    unmatched.append("gender")
                explanations.append("यह योजना केवल महिलाओं के लिए लागू है।")
                evidence["gender"] = f"Gender is {user_gender}"

        if "old_age" in scheme_id or "vridha" in scheme_id:
            if user_age is not None and user_age < 60:
                unmatched.append("age")
                explanations.append(f"वृद्धावस्था पेंशन के लिए न्यूनतम आयु 60 वर्ष है (आपकी आयु {user_age} वर्ष है)।")
                evidence["age"] = f"Age is {user_age} (< 60)"

        # C. Student / Education Schemes
        if scheme_cat in ["education", "शिक्षा"] or "scholarship" in scheme_id:
            # If applicant is not a student and has no school/college age children in family
            is_student = profile.get("is_student", False) or "छात्र" in profile_occ or "विद्यार्थी" in profile_occ
            has_student_child = any(
                6 <= (m.get("age") or 0) <= 25 or "छात्र" in (m.get("occupation") or "") or m.get("is_student")
                or (m.get("relationship") in ["पुत्र", "पुत्री", "बेटा", "बेटी", "बच्चा", "daughter", "son"])
                for m in (profile.get("members") or [])
            )
            if not is_student and not has_student_child and user_age is not None and user_age > 30 and profile.get("members") is not None:
                unmatched.append("is_student")
                explanations.append("यह छात्रवृत्ति योजना अध्ययनरत विद्यार्थियों के लिए है।")
                evidence["is_student"] = "No active student in profile or family"

        # -------------------------------------------------------------
        # 1. State check
        # -------------------------------------------------------------
        if "states" in conditions or scheme.get("applicable_states"):
            allowed_states = conditions.get("states") or scheme.get("applicable_states")
            st_status, st_reason = evaluate_state(profile.get("state"), allowed_states)
            if st_status == "matched":
                matched.append("state")
                evidence["state"] = profile.get("state")
            elif st_status == "unmatched":
                unmatched.append("state")
                explanations.append(st_reason)
                evidence["state"] = f"{profile.get('state')} not in {allowed_states}"
            elif st_status == "missing":
                missing.append("state")
                explanations.append(st_reason)

        # -------------------------------------------------------------
        # 2. Age check
        # -------------------------------------------------------------
        min_age = conditions.get("min_age")
        max_age = conditions.get("max_age")
        if min_age is not None or max_age is not None:
            age_status, age_reason = evaluate_age(profile.get("age"), min_age, max_age)
            if age_status == "matched":
                matched.append("age")
                evidence["age"] = f"{profile.get('age')} years"
            elif age_status == "unmatched":
                unmatched.append("age")
                explanations.append(age_reason)
                evidence["age"] = f"{profile.get('age')} not in range [{min_age}, {max_age}]"
            elif age_status == "missing":
                missing.append("age")
                explanations.append(age_reason)

        # -------------------------------------------------------------
        # 3. Gender check
        # -------------------------------------------------------------
        if "gender" in conditions:
            gen_status, gen_reason = evaluate_gender(profile.get("gender"), conditions["gender"])
            if gen_status == "matched":
                matched.append("gender")
                evidence["gender"] = profile.get("gender")
            elif gen_status == "unmatched":
                unmatched.append("gender")
                explanations.append(gen_reason)
                evidence["gender"] = f"{profile.get('gender')} not in {conditions['gender']}"
            elif gen_status == "missing":
                missing.append("gender")
                explanations.append(gen_reason)

        # -------------------------------------------------------------
        # 4. Marital status check
        # -------------------------------------------------------------
        if "marital_status" in conditions:
            mar_status, mar_reason = evaluate_marital_status(profile.get("marital_status"), conditions["marital_status"])
            if mar_status == "matched":
                matched.append("marital_status")
                evidence["marital_status"] = profile.get("marital_status")
            elif mar_status == "unmatched":
                unmatched.append("marital_status")
                explanations.append(mar_reason)
                evidence["marital_status"] = f"{profile.get('marital_status')} not in {conditions['marital_status']}"
            elif mar_status == "missing":
                missing.append("marital_status")
                explanations.append(mar_reason)

        # -------------------------------------------------------------
        # 5. Income check
        # -------------------------------------------------------------
        max_income = conditions.get("max_annual_income")
        if max_income is not None:
            inc_status, inc_reason = evaluate_income(profile.get("annual_income"), max_income)
            if inc_status == "matched":
                matched.append("annual_income")
                evidence["annual_income"] = f"₹{profile.get('annual_income'):,.0f} <= ₹{max_income:,.0f}"
            elif inc_status == "unmatched":
                unmatched.append("annual_income")
                explanations.append(inc_reason)
                evidence["annual_income"] = f"₹{profile.get('annual_income'):,.0f} exceeds ₹{max_income:,.0f}"
            elif inc_status == "missing":
                missing.append("annual_income")
                explanations.append(inc_reason)

        # -------------------------------------------------------------
        # 6. Occupation check
        # -------------------------------------------------------------
        if "occupation" in conditions:
            occ_status, occ_reason = evaluate_occupation(profile.get("occupation"), conditions["occupation"])
            if occ_status == "matched":
                matched.append("occupation")
                evidence["occupation"] = profile.get("occupation")
            elif occ_status == "unmatched":
                unmatched.append("occupation")
                explanations.append(occ_reason)
                evidence["occupation"] = f"{profile.get('occupation')} not in {conditions['occupation']}"
            elif occ_status == "missing":
                missing.append("occupation")
                explanations.append(occ_reason)

        # -------------------------------------------------------------
        # 6B. Education check
        # -------------------------------------------------------------
        if "education" in conditions:
            edu_status, edu_reason = evaluate_education(profile.get("education"), conditions["education"])
            if edu_status == "matched":
                matched.append("education")
                evidence["education"] = profile.get("education")
            elif edu_status == "unmatched":
                unmatched.append("education")
                explanations.append(edu_reason)
                evidence["education"] = f"{profile.get('education')} not in {conditions['education']}"
            elif edu_status == "missing":
                missing.append("education")
                explanations.append(edu_reason)

        # -------------------------------------------------------------
        # 7. Landholding check
        # -------------------------------------------------------------
        if conditions.get("has_landholding"):
            land_status, land_reason = evaluate_landholding(True, profile.get("landholding"))
            if land_status == "matched":
                matched.append("landholding")
                evidence["landholding"] = f"{profile.get('landholding')} acres"
            elif land_status == "unmatched":
                unmatched.append("landholding")
                explanations.append(land_reason)
                evidence["landholding"] = "Landless or not owned"
            elif land_status == "missing":
                missing.append("landholding")
                explanations.append(land_reason)

        # -------------------------------------------------------------
        # 8. Daughter check for girl child schemes
        # -------------------------------------------------------------
        if conditions.get("has_daughter"):
            members = profile.get("members") or []
            has_daughter = any("पुत्री" in (m.get("relationship") or "") or "बेटी" in (m.get("relationship") or "") for m in members)
            if has_daughter:
                matched.append("has_daughter")
                evidence["has_daughter"] = "Family has verified daughter"
            else:
                unmatched.append("has_daughter")
                explanations.append("यह योजना बालिकाओं/पुत्रियों के परिवारों के लिए लक्षित है।")

        # -------------------------------------------------------------
        # 9. Pregnancy / lactating check
        # -------------------------------------------------------------
        if conditions.get("is_pregnant_or_lactating"):
            if user_gender in ["पुरुष", "male", "purush"]:
                unmatched.append("is_pregnant_or_lactating")
                explanations.append("यह मातृत्व लाभ योजना केवल गर्भवती या धात्री महिलाओं के लिए है।")
            else:
                missing.append("is_pregnant_or_lactating")
                explanations.append("गर्भावस्था या हालिया प्रसव की जानकारी का सत्यापन आवश्यक है।")

        # -------------------------------------------------------------
        # 10. Student check
        # -------------------------------------------------------------
        if conditions.get("is_student"):
            has_student = profile.get("is_student", False)
            if not has_student:
                members = profile.get("members") or []
                has_student = any(
                    "छात्र" in (m.get("occupation") or "").lower() or
                    "विद्यार्थी" in (m.get("occupation") or "").lower() or
                    "student" in (m.get("occupation") or "").lower() or
                    (m.get("relationship") in ["पुत्र", "पुत्री", "बेटा", "बेटी", "बच्चा"] and 6 <= (m.get("age") or 0) <= 22)
                    for m in members
                )
            if has_student:
                matched.append("is_student")
                evidence["is_student"] = "Active student in profile or family"
            elif profile.get("is_student") is None and not profile.get("members"):
                missing.append("is_student")
                explanations.append("परिवार में अध्ययनरत छात्र/विद्यार्थी होने की जानकारी आवश्यक है।")
            else:
                unmatched.append("is_student")
                explanations.append("यह छात्रवृत्ति योजना अध्ययनरत विद्यार्थियों के लिए है।")

        # -------------------------------------------------------------
        # 11. Disability check
        # -------------------------------------------------------------
        if conditions.get("has_disability"):
            # Check self or family members
            self_dis = profile.get("has_disability")
            family_dis = any(m.get("has_disability") for m in profile.get("members", []))
            has_dis = self_dis or family_dis

            if has_dis:
                matched.append("has_disability")
                evidence["has_disability"] = "Self or family member has verified disability"
            elif profile.get("has_disability") is None and not profile.get("members"):
                missing.append("has_disability")
                explanations.append("दिव्यांगता प्रमाण पत्र की जानकारी आवश्यक है।")
            else:
                unmatched.append("has_disability")
                explanations.append("यह योजना केवल दिव्यांगजन नागरिकों या उनके परिवार के लिए है।")

        # -------------------------------------------------------------
        # 12. Exclusions check
        # -------------------------------------------------------------
        if scheme.get("exclusions"):
            excl_status, excl_reason = evaluate_exclusions(profile, scheme["exclusions"])
            if excl_status == "unmatched":
                unmatched.append("exclusions")
                explanations.append(excl_reason)
                evidence["exclusions"] = excl_reason

        # -------------------------------------------------------------
        # Final Status Determination (5 Official Outcomes)
        # 1. NOT_ELIGIBLE: Any confirmed condition failed
        # 2. NOT_ENOUGH_EVIDENCE: Minimal/almost no profile attributes provided
        # 3. MORE_INFORMATION_REQUIRED: Critical fields missing to decide
        # 4. POTENTIALLY_ELIGIBLE: Key conditions satisfied, secondary pending
        # 5. ELIGIBLE: All known conditions satisfied with evidence
        # -------------------------------------------------------------
        total_profile_attrs = sum(
            1 for k in ["age", "occupation", "annual_income", "marital_status", "landholding", "gender"]
            if profile.get(k) is not None
        )

        if len(unmatched) > 0:
            status = "NOT_ELIGIBLE"
            main_explanation = " ".join(explanations) or "योजना की कुछ मुख्य पात्रता शर्तें पूरी नहीं होती हैं।"
        elif total_profile_attrs <= 1 and len(matched) <= 1:
            status = "NOT_ENOUGH_EVIDENCE"
            main_explanation = "आपकी स्थिति की पर्याप्त जानकारी उपलब्ध नहीं है। पात्रता की सही जाँच के लिए आयु, पेशा और आय की जानकारी आवश्यक है।"
        elif len(missing) >= 3 and len(matched) <= 1:
            status = "MORE_INFORMATION_REQUIRED"
            main_explanation = "पात्रता विश्लेषण के लिए अधिक जानकारी की आवश्यकता है: " + " ".join(explanations)
        elif len(missing) > 0:
            status = "POTENTIALLY_ELIGIBLE"
            main_explanation = " ".join(explanations) or "प्राथमिक शर्तें अनुकूल हैं। दस्तावेज़ सत्यापन उपरांत अंतिम पात्रता तय होगी।"
        else:
            status = "ELIGIBLE"
            reasons = []
            if "marital_status" in matched:
                reasons.append("आपकी वैवाहिक स्थिति अनुकूल है")
            if "age" in matched:
                reasons.append(f"आपकी उम्र {profile.get('age', '')} वर्ष अनुकूल है")
            if "occupation" in matched or "landholding" in matched:
                reasons.append(f"आपका पेशा ({profile.get('occupation', '')}) अनुकूल है")
            if "education" in matched:
                reasons.append(f"आपकी शैक्षणिक योग्यता ({profile.get('education', '')}) अनुकूल है")
            if "annual_income" in matched:
                reasons.append("आपकी पारिवारिक आय तय सीमा के भीतर है")
            if "state" in matched:
                reasons.append(f"आप {profile.get('state', '')} के निवासी हैं")
            if "is_student" in matched:
                reasons.append("परिवार में अध्ययनरत विद्यार्थी हैं")
            if "has_disability" in matched:
                reasons.append("दिव्यांगता श्रेणी अनुकूल है")

            if reasons:
                main_explanation = "आपकी " + " और ".join(reasons) + "।"
            else:
                main_explanation = "आप इस योजना की सभी प्राथमिक शर्तें पूरी करते हैं।"

        # Backward compatibility with lowercase status
        normalized_status = status.lower()

        return {
            "scheme_id": scheme.get("id"),
            "scheme_name": scheme.get("scheme_name"),
            "scheme_name_hindi": scheme.get("scheme_name_hindi"),
            "department_hindi": scheme.get("department_hindi"),
            "department": scheme.get("department"),
            "category": scheme.get("category", "social_welfare"),
            "category_hindi": scheme.get("category_hindi"),
            "central_or_state": scheme.get("central_or_state", "central"),
            "applicable_states": scheme.get("applicable_states", ["All"]),
            "benefits": scheme.get("benefits"),
            "status": normalized_status,
            "status_enum": status,
            "matched_conditions": matched,
            "unmatched_conditions": unmatched,
            "missing_information": missing,
            "conditions_breakdown": {
                "satisfied": matched,
                "not_satisfied": unmatched,
                "unknown": missing,
                "evidence": evidence,
                "reason": main_explanation
            },
            "explanation": main_explanation,
            "official_source": scheme.get("official_source") or scheme.get("official_website"),
            "official_website": scheme.get("official_website"),
            "official_application_url": scheme.get("official_application_url") or scheme.get("official_website"),
            "last_verified_at": scheme.get("last_verified_at", "2024-11-01"),
            "disclaimer": "यह केवल प्रारंभिक पात्रता विश्लेषण है। अंतिम स्वीकृति संबंधित सरकारी विभाग द्वारा सत्यापन के बाद ही मान्य होगी।",
            "rule_version": "3.0"
        }
