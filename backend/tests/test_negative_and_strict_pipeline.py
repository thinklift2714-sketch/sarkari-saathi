"""
Comprehensive Negative & Strict Pipeline Tests for Sarkari Saathi.
Tests all scenarios specified in Part 10:
- TEST 1: Unrelated message ("I like playing football.")
- TEST 2: Random / Gibberish text ("asdfghjkl 123 xyz")
- TEST 3: Greeting ("Hello, how are you?")
- TEST 4: Vague request ("I need help.")
- TEST 5: Single occupation without details ("I am a farmer.")
- TEST 6: Complete farmer profile ("I am a 45-year-old farmer from Meerut, Uttar Pradesh...")
- TEST 7: Unemployed graduate ("I am a 23-year-old unemployed graduate from Meerut.")
- TEST 8: Senior citizen with disabled wife ("I am a 67-year-old man and my wife has a certified disability.")
- TEST 9: Incomplete beneficiary request (targeted follow-up question, no guessing)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.input_validator import input_validator, InputCategory
from app.services.profile_extractor import profile_extractor
from app.rule_engine.evaluator import SchemeEvaluator

client = TestClient(app)


# ----------------------------------------------------------------------
# TEST 1: Unrelated message ("I like playing football.")
# ----------------------------------------------------------------------
def test_unrelated_message_does_not_recommend_schemes():
    """
    TEST 1: User says 'I like playing football.'
    Expected: No scheme recommendations. Ask how assistant can help with govt schemes.
    """
    # 1. Unit test classifier
    val = input_validator.classify("I like playing football.")
    assert val["category"] == InputCategory.UNRELATED_MESSAGE
    assert val["is_valid"] is False
    assert val["can_search_schemes"] is False

    # 2. Endpoint test
    res = client.post("/api/conversation/message", json={
        "message": "I like playing football.",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] == 0
    assert data["total_discovered"] == 0
    assert len(data["top_schemes"]) == 0
    assert "सरकारी" in data["message"] or "योजना" in data["message"]


# ----------------------------------------------------------------------
# TEST 2: Random / Gibberish text ("asdfghjkl 123 xyz")
# ----------------------------------------------------------------------
def test_gibberish_input_does_not_recommend_schemes():
    """
    TEST 2: User sends random keyboard gibberish.
    Expected: No scheme recommendations. Ask user to enter a meaningful message.
    """
    val = input_validator.classify("asdfghjkl 123 xyz")
    assert val["category"] == InputCategory.RANDOM_OR_GIBBERISH_TEXT
    assert val["is_valid"] is False
    assert val["can_search_schemes"] is False

    res = client.post("/api/conversation/message", json={
        "message": "asdfghjkl 123 xyz",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] == 0
    assert data["total_discovered"] == 0
    assert len(data["top_schemes"]) == 0
    assert "समझ नहीं आया" in data["message"] or "स्पष्ट" in data["message"]


# ----------------------------------------------------------------------
# TEST 3: Greeting ("Hello, how are you?")
# ----------------------------------------------------------------------
def test_greeting_does_not_trigger_scheme_search():
    """
    TEST 3: User says 'Hello, how are you?'
    Expected: Normal greeting response. No scheme search or recommendations.
    """
    val = input_validator.classify("Hello, how are you?")
    assert val["category"] == InputCategory.GREETING
    assert val["is_valid"] is False
    assert val["can_search_schemes"] is False

    res = client.post("/api/conversation/message", json={
        "message": "Hello, how are you?",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] == 0
    assert data["total_discovered"] == 0
    assert len(data["top_schemes"]) == 0
    assert "नमस्ते" in data["message"] or "सरकारी साथी" in data["message"]


# ----------------------------------------------------------------------
# TEST 4: Vague request ("I need help.")
# ----------------------------------------------------------------------
def test_vague_help_request_asks_clarification():
    """
    TEST 4: User says 'I need help.'
    Expected: Ask what kind of help user needs. No random schemes.
    """
    res = client.post("/api/conversation/message", json={
        "message": "I need help.",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] == 0
    assert data["total_discovered"] == 0
    assert len(data["top_schemes"]) == 0
    assert data["next_action"] == "ask_followup"


# ----------------------------------------------------------------------
# TEST 5: Single occupation without details ("I am a farmer.")
# ----------------------------------------------------------------------
def test_farmer_incomplete_asks_followup_not_instant_eligible():
    """
    TEST 5: User says 'I am a farmer.'
    Expected: Ask for state, district and relevant land/income information.
    Do not immediately declare eligibility or return schemes.
    """
    res = client.post("/api/conversation/message", json={
        "message": "I am a farmer.",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    # Must NOT immediately recommend schemes without location/land
    assert data["matched_schemes_count"] == 0
    assert len(data["top_schemes"]) == 0
    assert data["next_action"] == "ask_followup"
    assert "राज्य" in data["message"] or "जिला" in data["message"] or "जमीन" in data["message"]


# ----------------------------------------------------------------------
# TEST 6: Complete farmer profile ("I am a 45-year-old farmer from Meerut...")
# ----------------------------------------------------------------------
def test_complete_farmer_profile_recommends_agriculture_schemes():
    """
    TEST 6: User: 'I am a 45-year-old farmer from Meerut, Uttar Pradesh.
    My annual family income is ₹75,000 and I own 1.5 acres of land.'
    Expected: Extract profile and investigate relevant agriculture and family welfare schemes.
    """
    msg = "I am a 45-year-old farmer from Meerut, Uttar Pradesh. My annual family income is ₹75,000 and I own 1.5 acres of land."
    val = input_validator.classify(msg)
    assert val["category"] == InputCategory.VALID_BENEFICIARY_REQUEST
    assert val["can_search_schemes"] is True

    extracted = profile_extractor.extract(msg)["extracted_data"]
    assert extracted["age"] == 45
    assert extracted["occupation"] == "किसान"
    assert extracted["state"] == "उत्तर प्रदेश"
    assert extracted["district"] == "मेरठ"
    assert extracted["annual_income"] == 75000.0
    assert extracted["landholding"] == 1.5

    res = client.post("/api/conversation/message", json={
        "message": msg,
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] > 0
    assert data["next_action"] == "ready_for_results"

    # Must contain agriculture schemes like PM-Kisan or UP Kisan Pension
    scheme_names = [s["name"] for s in data["top_schemes"]]
    has_agri = any("किसान" in name or "कृषि" in name or "फसल" in name for name in scheme_names)
    assert has_agri is True

    # Must NOT recommend Widow Pension to a married male farmer!
    has_widow = any("विधवा" in name for name in scheme_names)
    assert has_widow is False


# ----------------------------------------------------------------------
# TEST 7: Unemployed graduate ("I am a 23-year-old unemployed graduate from Meerut.")
# ----------------------------------------------------------------------
def test_unemployed_graduate_recommends_employment_not_farmer_or_pension():
    """
    TEST 7: User: 'I am a 23-year-old unemployed graduate from Meerut.'
    Expected: Investigate employment, skill development, and youth schemes.
    Must NOT recommend farmer (PM-Kisan) or pension schemes (Widow/Old age pension).
    """
    msg = "I am a 23-year-old unemployed graduate from Meerut, Uttar Pradesh."
    res = client.post("/api/conversation/message", json={
        "message": msg,
        "history": []
    })
    assert res.status_code == 200
    data = res.json()

    scheme_names = [s["name"] for s in data["top_schemes"]]
    # Never recommend farmer schemes to an unemployed graduate without land
    for name in scheme_names:
        assert "पीएम-किसान" not in name
        assert "विधवा पेंशन" not in name
        assert "वृद्धावस्था पेंशन" not in name


# ----------------------------------------------------------------------
# TEST 8: 67-year-old man and wife has certified disability
# ----------------------------------------------------------------------
def test_senior_citizen_with_disabled_wife_extracts_both():
    """
    TEST 8: User: 'I am a 67-year-old man and my wife has a certified disability.'
    Expected: Extract senior citizen status for applicant and disability for wife.
    """
    msg = "I am a 67-year-old man from Uttar Pradesh and my wife has a certified disability."
    ext = profile_extractor.extract(msg)["extracted_data"]
    assert ext["age"] == 67
    assert ext["gender"] == "पुरुष"
    assert len(ext.get("members", [])) >= 1
    wife = ext["members"][0]
    assert wife["relationship"] == "पत्नी"
    assert wife.get("has_disability") is True


# ----------------------------------------------------------------------
# TEST 9: Incomplete information asks targeted follow-up question
# ----------------------------------------------------------------------
def test_incomplete_profile_asks_targeted_question_no_guessing():
    """
    TEST 9: User: 'I am looking for government assistance for my education.'
    Expected: Ask targeted follow-up question about state/class. No scheme recommendation yet.
    """
    msg = "I am looking for government assistance for my education."
    res = client.post("/api/conversation/message", json={
        "message": msg,
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert data["matched_schemes_count"] == 0
    assert len(data["top_schemes"]) == 0
    assert data["next_action"] == "ask_followup"
    assert "राज्य" in data["message"] or "कक्षा" in data["message"] or "पढ़ाई" in data["message"]
