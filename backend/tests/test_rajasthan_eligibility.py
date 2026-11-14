import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.profile_extractor import ProfileExtractor
from app.services.discovery_service import discovery_service
from app.rule_engine.evaluator import SchemeEvaluator
from app.database import get_scheme_by_id

client = TestClient(app)

TEST_USER_INPUT = """Age: 24
Gender: Male
State: Rajasthan
Education: B.Com Graduate
Occupation: Unemployed
Annual Family Income: 1.5 lakh
Father's Occupation: Farmer
Agricultural Land: 1 acre, owned by father
Requirements: Employment assistance, skill development, unemployment benefits and financial assistance for starting a small business."""


def test_rajasthan_profile_extraction():
    """Verify accurate parameter extraction without cross-contamination or assumptions."""
    res = ProfileExtractor.extract(TEST_USER_INPUT, existing_profile={})
    data = res["extracted_data"]

    # 1. Age, gender, state
    assert data.get("age") == 24
    assert data.get("gender") in ["पुरुष", "male", "Male"]
    assert data.get("state") == "राजस्थान"

    # 2. Education & Income
    assert "स्नातक" in (data.get("education") or "") or "graduate" in (data.get("education") or "").lower()
    assert data.get("annual_income") == 150000.0

    # 3. Applicant occupation: Must be Unemployed, NOT Farmer!
    assert "बेरोजगार" in (data.get("occupation") or "") or "unemployed" in (data.get("occupation") or "").lower()
    assert data.get("father_occupation") == "किसान"

    # 4. Land ownership: Father owns the land, NOT the applicant!
    assert data.get("owns_agricultural_land") is False
    assert data.get("landholding") == 0.0
    assert data.get("family_landholding") == 1.0

    # 5. Assistance requirements
    assert "employment" in data.get("target_categories", [])
    assert "skills" in data.get("target_categories", [])
    assert "business" in data.get("target_categories", [])


def test_strict_scheme_rejections():
    """Verify that UP widow pension, farmer schemes, and girl child schemes are rejected."""
    prof = {
        "age": 24,
        "gender": "पुरुष",
        "marital_status": "अविवाहित",
        "state": "राजस्थान",
        "education": "स्नातक (Graduate)",
        "occupation": "बेरोजगार युवा",
        "owns_agricultural_land": False,
        "landholding": 0.0,
        "family_landholding": 1.0,
        "annual_income": 150000.0,
        "members": []
    }

    # A. UP Widow Pension: Must fail (Male + Not UP + Not Widow)
    widow_scheme = get_scheme_by_id("scheme_up_widow_pension")
    if widow_scheme:
        eval_res = SchemeEvaluator.evaluate(prof, widow_scheme)
        assert eval_res["status"] == "not_eligible"
        assert any(cond in eval_res["unmatched_conditions"] for cond in ["gender", "marital_status", "state"])

    # B. PM-KISAN: Must fail (Applicant has landholding == 0.0, does not own agricultural land)
    pm_kisan = get_scheme_by_id("scheme_pm_kisan")
    if pm_kisan:
        eval_res = SchemeEvaluator.evaluate(prof, pm_kisan)
        assert eval_res["status"] == "not_eligible"
        assert "landholding" in eval_res["unmatched_conditions"]

    # C. Kisan Credit Card (KCC): Must fail
    kcc = get_scheme_by_id("scheme_kcc")
    if kcc:
        eval_res = SchemeEvaluator.evaluate(prof, kcc)
        assert eval_res["status"] == "not_eligible"

    # D. Sukanya Samriddhi Yojana: Must fail (Applicant has no daughter)
    ssy = get_scheme_by_id("scheme_sukanya_samriddhi")
    if ssy:
        eval_res = SchemeEvaluator.evaluate(prof, ssy)
        assert eval_res["status"] == "not_eligible"
        assert "has_daughter" in eval_res["unmatched_conditions"]

    # E. UP Divyang Pension: Must fail (Not UP + No disability)
    up_divyang = get_scheme_by_id("scheme_up_divyang_pension")
    if up_divyang:
        eval_res = SchemeEvaluator.evaluate(prof, up_divyang)
        assert eval_res["status"] == "not_eligible"


def test_relevant_schemes_eligible():
    """Verify that Rajasthan Yuva Sambal, PMEGP, MUDRA, PMKVY, and MLUPY are eligible."""
    prof = {
        "age": 24,
        "gender": "पुरुष",
        "marital_status": "अविवाहित",
        "state": "राजस्थान",
        "education": "स्नातक (Graduate)",
        "occupation": "बेरोजगार युवा",
        "owns_agricultural_land": False,
        "landholding": 0.0,
        "annual_income": 150000.0,
        "target_categories": ["employment", "skills", "business"],
        "assistance_requirement": "employment",
        "members": []
    }

    disc = discovery_service.discover_schemes(prof)
    eligible_ids = [s["scheme_id"] for s in disc["results"]["eligible"]]

    # Rajasthan Yuva Sambal (Unemployment allowance for graduates in Rajasthan)
    assert "scheme_rajasthan_yuva_sambal" in eligible_ids

    # Business & Skill Central/State schemes
    assert "scheme_pmegp" in eligible_ids
    assert "scheme_pm_mudra" in eligible_ids
    assert "scheme_pmkvy" in eligible_ids
    assert "scheme_rajasthan_mlupy" in eligible_ids


def test_conversation_api_end_to_end():
    """End-to-end conversation API test for the user's exact input."""
    response = client.post(
        "/api/conversation/message",
        json={
            "message": TEST_USER_INPUT,
            "session_id": "test_rajasthan_e2e_session"
        }
    )
    assert response.status_code == 200
    data = response.json()

    assert data["matched_schemes_count"] > 0
    assert data["next_action"] == "ready_for_results"

    top_schemes = data.get("top_schemes", [])
    assert len(top_schemes) > 0

    top_names = [s.get("name", "") + " " + s.get("name_en", "") for s in top_schemes]
    top_combined = " ".join(top_names).lower()

    # MUST NOT recommend widow or UP-restricted schemes
    assert "विधवा" not in top_combined
    assert "widow" not in top_combined
    assert "up " not in top_combined

    # Debug trace must be present and contain all 4 stages
    trace = data.get("debug_trace")
    assert trace is not None
    assert "user_input" in trace
    assert "extracted_profile" in trace
    assert "engine_profile" in trace
    assert "accepted_schemes" in trace
    assert "rejected_schemes" in trace
