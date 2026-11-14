"""
Test Suite: Rigorous Verification of 4 Distinct Citizen Profiles
Validates:
1. Strict profile extraction (no hallucination, father's land not attributed to applicant, gender accuracy)
2. Strict eligibility filtering (no widow schemes for males/married women, no UP schemes in Rajasthan/MP/Maharashtra)
3. Domain relevance (agriculture only for farmers/landowners, business/employment/education targeting)
4. Cross-user isolation (consecutive requests never leak state or persona)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.profile_extractor import profile_extractor
from app.services.discovery_service import discovery_service
from app.services.analysis_service import analysis_service
from app.rule_engine.evaluator import SchemeEvaluator
from app.database import get_all_schemes, create_empty_profile


@pytest.fixture
def client():
    return TestClient(app)


# =====================================================================
# TEST 1: Unemployed Male, 24, Rajasthan, B.Com, Father owns 1 acre
# =====================================================================
def test_profile_1_unemployed_rajasthan_male():
    user_input = """
    Age: 24
    Gender: Male
    State: Rajasthan
    Education: B.Com Graduate
    Occupation: Unemployed
    Annual Family Income: ₹1.5 lakh
    Father's Occupation: Farmer
    Agricultural Land: 1 acre, owned by father
    Requirements: Employment assistance, skill development, unemployment benefits and financial assistance for starting a small business.
    """
    ext = profile_extractor.extract(user_input)["extracted_data"]

    assert ext["age"] == 24
    assert ext["gender"] == "पुरुष"
    assert ext["state"] == "राजस्थान"
    assert "स्नातक" in ext["education"] or "Graduate" in ext["education"]
    assert ext["occupation"] == "बेरोजगार युवा"
    assert ext["annual_income"] == 150000.0
    assert ext["landholding"] == 0.0  # Father's land NOT applicant's
    assert ext["owns_agricultural_land"] is False
    assert ext.get("marital_status") != "विधवा"

    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT EXCLUSIONS
    assert "scheme_up_widow_pension" not in all_recommended_ids, "Male in Rajasthan must NEVER get UP Widow Pension!"
    assert "scheme_nfbs" not in all_recommended_ids, "Male in Rajasthan must NEVER get UP NFBS!"
    assert "scheme_up_krishak_durghatna" not in all_recommended_ids, "Must not get UP farmer accident scheme!"
    assert "scheme_up_krishi_yantra" not in all_recommended_ids, "Must not get UP farm equipment scheme!"
    assert "scheme_pm_kisan" not in eligible_ids, "Cannot be eligible for PM-KISAN without personal land ownership!"
    assert "scheme_pmfby" not in eligible_ids, "Cannot be eligible for PMFBY without crop/land!"

    # STRICT INCLUSIONS
    assert "scheme_rajasthan_yuva_sambal" in eligible_ids, "Rajasthan unemployed graduate must be eligible for Yuva Sambal!"
    assert "scheme_pmegp" in eligible_ids, "Unemployed graduate seeking business loan must be eligible for PMEGP!"
    assert "scheme_pmkvy" in eligible_ids, "Youth seeking skill development must be eligible for PMKVY!"


# =====================================================================
# TEST 2: Married Female, 32, Madhya Pradesh, Daily-wage / Tailoring
# =====================================================================
def test_profile_2_female_entrepreneur_mp():
    user_input = """
    Age: 32
    Gender: Female
    State: Madhya Pradesh
    Marital Status: Married
    Education: 12th Pass
    Occupation: Daily-wage worker
    Annual Family Income: ₹90,000
    Family Details: Husband (daily-wage worker), 2 school-going children
    Housing: Kutcha house
    Requirements: Financial assistance to start a tailoring business, women welfare benefits and housing assistance
    """
    ext = profile_extractor.extract(user_input)["extracted_data"]

    assert ext["age"] == 32
    assert ext["gender"] == "महिला", "Gender must be correctly extracted as Female, not Male!"
    assert ext["state"] == "मध्य प्रदेश"
    assert ext["marital_status"] == "विवाहित"
    assert ext["marital_status"] != "विधवा", "Married woman must NEVER be classified as widow!"
    assert ext["annual_income"] == 90000.0
    assert ext["occupation"] in ["मजदूर / श्रमिक", "दर्जी / कारीगर / कामगार"]
    assert "kutcha" in ext.get("housing_status", "").lower() or "कच्चा" in ext.get("housing_status", "")

    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT EXCLUSIONS
    assert "scheme_up_widow_pension" not in all_recommended_ids, "Married woman in MP must NEVER get UP Widow Pension!"
    assert "scheme_nfbs" not in all_recommended_ids, "Must not get UP NFBS!"
    assert "scheme_rajasthan_yuva_sambal" not in all_recommended_ids, "Must not get Rajasthan scheme in MP!"
    assert "scheme_up_krishak_durghatna" not in all_recommended_ids, "Must not get UP schemes in MP!"

    # STRICT INCLUSIONS
    assert "scheme_mp_udyam_kranti" in eligible_ids, "MP woman starting tailoring business must get MP Udyam Kranti!"
    assert "scheme_mp_ladli_behna" in eligible_ids, "MP married woman (₹90k income) must get Ladli Behna Yojana!"
    assert "scheme_pm_vishwakarma" in eligible_ids or "scheme_pm_vishwakarma" in potential_ids, "Tailoring qualifies for PM Vishwakarma!"
    assert "scheme_pmegp" in eligible_ids, "12th pass starting business must get PMEGP!"
    assert "scheme_pmay_g" in eligible_ids or "scheme_pmay_g" in potential_ids, "Rural kutcha house with low income qualifies for PMAY-G!"


# =====================================================================
# TEST 3: Private Employee, 45, Maharashtra, Daughter's Education
# =====================================================================
def test_profile_3_private_employee_maharashtra():
    user_input = """
    Age: 45
    Gender: Male
    State: Maharashtra
    Marital Status: Married
    Occupation: Private-sector employee
    Annual Family Income: ₹4,00,000
    Agricultural Land: None
    Family Details: Wife, 18-year-old daughter studying in college
    Requirements: Financial assistance and scholarship for daughter's higher education
    """
    ext = profile_extractor.extract(user_input)["extracted_data"]

    assert ext["age"] == 45
    assert ext["gender"] == "पुरुष"
    assert ext["state"] == "महाराष्ट्र"
    assert ext["marital_status"] == "विवाहित"
    assert "निजी" in ext["occupation"] or "Private" in ext["occupation"]
    assert ext["annual_income"] == 400000.0
    assert ext["landholding"] == 0.0
    assert ext["owns_agricultural_land"] is False

    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT EXCLUSIONS
    assert "scheme_pm_kisan" not in all_recommended_ids, "Private employee with no land must NEVER get PM-KISAN!"
    assert "scheme_pmfby" not in all_recommended_ids, "No land = no crop insurance!"
    assert "scheme_kcc" not in all_recommended_ids, "No land = no KCC!"
    assert "scheme_up_widow_pension" not in all_recommended_ids, "Male in Maharashtra must NEVER get UP Widow Pension!"
    assert "scheme_rajasthan_yuva_sambal" not in all_recommended_ids, "Maharashtra resident must not get Rajasthan schemes!"
    assert "scheme_up_krishi_yantra" not in all_recommended_ids, "Must not get UP agriculture schemes!"
    assert "scheme_mp_ladli_behna" not in all_recommended_ids, "Male in Maharashtra must not get MP Ladli Behna!"

    # STRICT INCLUSIONS
    assert "scheme_maha_ebc_scholarship" in eligible_ids, "Daughter in college with family income up to 8L in Maharashtra must get Maha EBC scholarship!"


# =====================================================================
# TEST 4: Widow Farmer, 52, Uttar Pradesh (Verified Baseline Persona)
# =====================================================================
def test_profile_4_widow_farmer_up():
    user_input = """
    Age: 52
    Gender: Female
    State: Uttar Pradesh
    District: Varanasi
    Marital Status: Widow
    Occupation: Farmer
    Annual Family Income: ₹45,000
    Agricultural Land: 0.8 acre
    Requirements: Widow pension, farmer assistance, crop insurance and family benefit
    """
    ext = profile_extractor.extract(user_input)["extracted_data"]

    assert ext["age"] == 52
    assert ext["gender"] == "महिला"
    assert ext["state"] == "उत्तर प्रदेश"
    assert ext["marital_status"] == "विधवा"
    assert ext["annual_income"] == 45000.0
    assert ext["landholding"] == 0.8
    assert ext["owns_agricultural_land"] is True

    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT INCLUSIONS for UP Widow Farmer
    assert "scheme_up_widow_pension" in eligible_ids, "52yo UP widow with low income must be eligible for UP Widow Pension!"
    assert "scheme_pm_kisan" in eligible_ids, "Farmer owning 0.8 acre must be eligible for PM-KISAN!"
    assert "scheme_pmfby" in eligible_ids, "Farmer owning land must be eligible for PMFBY!"
    assert "scheme_nfbs" in eligible_ids or "scheme_nfbs" in potential_ids, "UP BPL widow must be eligible for NFBS!"

    # STRICT EXCLUSIONS
    assert "scheme_rajasthan_yuva_sambal" not in all_recommended_ids, "UP resident must not get Rajasthan schemes!"
    assert "scheme_mp_udyam_kranti" not in all_recommended_ids, "UP resident must not get MP schemes!"
    assert "scheme_maha_ebc_scholarship" not in all_recommended_ids, "UP resident must not get Maharashtra schemes!"


# =====================================================================
# TEST 5: Cross-User Session Isolation & Zero Contamination
# =====================================================================
def test_cross_user_isolation(client):
    """
    Tests sequential requests across different users.
    Verifies that User 4 (UP Widow) running first does NOT contaminate
    subsequent requests for User 1 (Rajasthan Male) or User 2 (MP Female).
    """
    # Run UP Widow first (the notorious contaminated persona)
    resp_up = client.post("/api/schemes/analyze", json={
        "user_input": "Age: 52, Gender: Female, State: Uttar Pradesh, Marital Status: Widow, Occupation: Farmer, Land: 0.8 acre, Income: 45000"
    })
    assert resp_up.status_code == 200

    # Immediately run Rajasthan Male
    resp_rj = client.post("/api/schemes/analyze", json={
        "user_input": "Age: 24, Gender: Male, State: Rajasthan, Occupation: Unemployed, Education: B.Com, Income: 150000, Requirements: Job"
    })
    assert resp_rj.status_code == 200
    aid_rj = resp_rj.json()["analysis_id"]

    # Verify session was created with empty profile base (not Seeta Devi)
    session_rj = analysis_service.get_session(aid_rj)
    assert session_rj is not None
    assert session_rj.initial_profile.get("gender") is None
    assert session_rj.initial_profile.get("name") in [None, ""]

    # Run discovery directly with empty profile -> verify NO Seeta Devi defaults
    empty_prof = create_empty_profile()
    res_empty = discovery_service.discover_schemes(profile=empty_prof)
    assert res_empty["summary"]["eligible_count"] == 0, "Empty profile must have 0 eligible schemes!"


# =====================================================================
# TEST 6: Situation A — 38yo Widowed Mother in UP, Monthly ₹3,000
# =====================================================================
def test_situation_a_widowed_mother_up():
    from app.services.input_validator import input_validator, InputCategory
    user_input = "I am a 38-year-old widowed woman from Uttar Pradesh with two children and a monthly income of ₹3,000. I need financial help and support for my children's education."

    # 1. Input Validator must classify as VALID beneficiary request (not gibberish!)
    val = input_validator.classify(user_input)
    assert val["is_valid"] is True
    assert val["can_search_schemes"] is True
    assert val["category"] in [InputCategory.VALID_BENEFICIARY_REQUEST, InputCategory.INCOMPLETE_BENEFICIARY_REQUEST]

    # 2. Profile Extraction
    ext = profile_extractor.extract(user_input)["extracted_data"]
    assert ext["age"] == 38
    assert ext["gender"] == "महिला"
    assert ext["marital_status"] == "विधवा"
    assert ext["state"] == "उत्तर प्रदेश"
    assert ext["monthly_income"] == 3000.0
    assert ext["annual_income"] == 36000.0  # ₹3,000/mo * 12 = ₹36,000/yr
    assert len(ext.get("members", [])) >= 2  # Two children
    assert any(m.get("is_student") for m in ext.get("members", []))

    # 3. Scheme Recommendations
    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT INCLUSIONS
    assert "scheme_up_widow_pension" in eligible_ids, "38yo destitute widow in UP with income ₹36k/yr must get UP Destitute Widow Pension!"
    assert "scheme_up_scholarship_post" in eligible_ids or "scheme_up_scholarship_post" in potential_ids or "scheme_up_pre_matric" in eligible_ids, "Mother with school children must get UP Scholarship!"
    assert "scheme_nfbs" in eligible_ids or "scheme_nfbs" in potential_ids, "Destitute widow must qualify for NFBS!"

    # STRICT EXCLUSIONS
    assert "scheme_pm_kisan" not in all_recommended_ids, "Widow with no farm land must NOT get PM-KISAN!"
    assert "scheme_pmfby" not in all_recommended_ids, "Widow with no land must NOT get PMFBY!"
    assert "scheme_kcc" not in all_recommended_ids, "Widow with no land must NOT get KCC!"
    assert "scheme_up_krishak_durghatna" not in all_recommended_ids, "Must NOT get farmer accident scheme!"
    assert "scheme_bihar_mnssby" not in all_recommended_ids, "UP resident must NEVER get Bihar MNSSBY!"
    assert "scheme_bihar_udyami" not in all_recommended_ids, "UP resident must NEVER get Bihar Udyami!"


# =====================================================================
# TEST 7: Situation B — 24yo Unmarried Unemployed Man in Bihar
# =====================================================================
def test_situation_b_unemployed_man_bihar():
    from app.services.input_validator import input_validator, InputCategory
    user_input = "I am a 24-year-old unmarried man from Bihar. I have completed graduation, am currently unemployed, and want to start a small business or get job training."

    # 1. Input Validator
    val = input_validator.classify(user_input)
    assert val["is_valid"] is True
    assert val["can_search_schemes"] is True

    # 2. Profile Extraction
    ext = profile_extractor.extract(user_input)["extracted_data"]
    assert ext["age"] == 24
    assert ext["gender"] == "पुरुष"
    assert ext["marital_status"] == "अविवाहित"
    assert ext["state"] in ["Bihar", "बिहार"]
    assert ext["occupation"] == "बेरोजगार युवा"
    assert "स्नातक" in ext.get("education", "") or "Graduate" in ext.get("education", "")

    # 3. Scheme Recommendations
    res = discovery_service.discover_schemes(profile=ext, limit=30)
    eligible_ids = [s["scheme_id"] for s in res["results"]["eligible"]]
    potential_ids = [s["scheme_id"] for s in res["results"]["potentially_eligible"]]
    all_recommended_ids = eligible_ids + potential_ids

    # STRICT INCLUSIONS
    assert "scheme_bihar_mnssby" in eligible_ids, "24yo unemployed graduate in Bihar must get Bihar MNSSBY allowance!"
    assert "scheme_bihar_udyami" in eligible_ids, "Graduate in Bihar wanting small business must get Bihar Udyami Yojana!"
    assert "scheme_bihar_kushal_yuva" in eligible_ids, "Youth in Bihar seeking job training must get Kushal Yuva Program!"

    # STRICT EXCLUSIONS
    assert "scheme_up_widow_pension" not in all_recommended_ids, "Unmarried male in Bihar must NEVER get UP Widow Pension!"
    assert "scheme_nfbs" not in all_recommended_ids, "Must NOT get UP NFBS!"
    assert "scheme_up_krishak_durghatna" not in all_recommended_ids, "Must NOT get UP Krishak Durghatna!"
    assert "scheme_pm_kisan" not in all_recommended_ids, "Unemployed youth with 0 land must NOT get PM-KISAN!"
    assert "scheme_pmfby" not in all_recommended_ids, "Must NOT get PMFBY!"


# =====================================================================
# TEST 8: Consecutive Situation A then Situation B in the SAME Session
# =====================================================================
def test_consecutive_situation_a_then_b_in_same_session(client):
    import uuid
    from app.database import get_session_profile
    shared_session_id = f"test-session-{uuid.uuid4()}"

    # Step 1: Citizen A submits situation into shared session
    resp_a = client.post("/api/conversation/message", json={
        "message": "I am a 38-year-old widowed woman from Uttar Pradesh with two children and a monthly income of ₹3,000. I need financial help and support for my children's education.",
        "session_id": shared_session_id
    })
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    top_a_names = [s.get("scheme_name") for s in data_a.get("top_schemes", [])]

    # Verify Situation A got UP widow / education schemes
    assert any("Widow" in name or "विधवा" in name or "Scholarship" in name or "NFBS" in name or "Garib Kalyan" in name for name in top_a_names)

    # Step 2: Citizen B submits situation into the EXACT SAME shared session
    resp_b = client.post("/api/conversation/message", json={
        "message": "I am a 24-year-old unmarried man from Bihar. I have completed graduation, am currently unemployed, and want to start a small business or get job training.",
        "session_id": shared_session_id
    })
    assert resp_b.status_code == 200
    data_b = resp_b.json()

    # Verify is_fresh_profile was recognized
    assert data_b.get("is_fresh_profile") is True

    # Verify session profile was REPLACED, not contaminated
    active_prof = get_session_profile(shared_session_id)
    assert active_prof.get("state") in ["Bihar", "बिहार"]
    assert active_prof.get("state") != "उत्तर प्रदेश"
    assert active_prof.get("gender") == "पुरुष"
    assert active_prof.get("marital_status") == "अविवाहित"
    assert active_prof.get("marital_status") != "विधवा"
    assert active_prof.get("age") == 24
    assert len(active_prof.get("members", [])) == 0  # Citizen B does NOT have Citizen A's children!

    # Verify recommended schemes for Citizen B have ZERO cross-contamination
    top_b_names = [s.get("scheme_name") for s in data_b.get("top_schemes", [])]
    for name in top_b_names:
        assert "Widow" not in name and "विधवा" not in name, f"Citizen B was contaminated with widow scheme: {name}"
        assert "Krishak" not in name and "Mechanization" not in name, f"Citizen B was contaminated with farmer scheme: {name}"
        assert "Uttar Pradesh" not in name, f"Citizen B was contaminated with UP scheme: {name}"

    # Verify Bihar schemes are present
    assert any("MNSSBY" in name or "Udyami" in name or "Kushal Yuva" in name or "PMEGP" in name for name in top_b_names)
