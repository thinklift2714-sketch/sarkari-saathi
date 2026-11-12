"""
Unit tests for Sarkari Saathi Python Rule Engine.
"""
import pytest
from app.rule_engine.evaluator import SchemeEvaluator


@pytest.fixture
def seeta_devi_profile():
    return {
        "name": "सीता देवी",
        "age": 52,
        "gender": "महिला",
        "marital_status": "विधवा",
        "state": "उत्तर प्रदेश",
        "district": "वाराणसी",
        "occupation": "किसान की विधवा",
        "annual_income": 45000.0,
        "landholding": 0.8,
        "family_size": 2,
        "members": [
            {"name": "सीता देवी", "relationship": "मुख्य सदस्य", "age": 52, "occupation": "किसान की विधवा"},
            {"name": "राम कुमार", "relationship": "पुत्र", "age": 28, "occupation": "किसान"}
        ]
    }


@pytest.fixture
def up_widow_pension_scheme():
    return {
        "id": "scheme_up_widow_pension",
        "scheme_name": "UP Widow Pension Scheme",
        "scheme_name_hindi": "विधवा पेंशन योजना",
        "department_hindi": "सामाजिक न्याय विभाग, उत्तर प्रदेश",
        "applicable_states": ["उत्तर प्रदेश"],
        "eligibility_conditions": {
            "min_age": 18,
            "marital_status": ["विधवा", "widowed"],
            "states": ["उत्तर प्रदेश"],
            "max_annual_income": 200000,
            "gender": ["महिला"]
        }
    }


@pytest.fixture
def pm_kisan_scheme():
    return {
        "id": "scheme_pm_kisan",
        "scheme_name": "PM Kisan Samman Nidhi",
        "scheme_name_hindi": "प्रधानमंत्री किसान सम्मान निधि",
        "department_hindi": "कृषि एवं किसान कल्याण मंत्रालय",
        "applicable_states": ["All"],
        "eligibility_conditions": {
            "occupation": ["किसान", "किसान की विधवा", "कृषि"],
            "has_landholding": True
        }
    }


@pytest.fixture
def old_age_pension_scheme():
    return {
        "id": "scheme_ignoaps",
        "scheme_name": "Old Age Pension Scheme",
        "scheme_name_hindi": "राष्ट्रीय वृद्धावस्था पेंशन योजना",
        "department_hindi": "सामाजिक न्याय एवं ग्रामीण विकास मंत्रालय",
        "applicable_states": ["All"],
        "eligibility_conditions": {
            "min_age": 60,
            "max_annual_income": 100000
        }
    }


def test_widow_pension_eligibility(seeta_devi_profile, up_widow_pension_scheme):
    result = SchemeEvaluator.evaluate(seeta_devi_profile, up_widow_pension_scheme)
    assert result["status"] == "eligible"
    assert "marital_status" in result["matched_conditions"]
    assert "age" in result["matched_conditions"]
    assert "state" in result["matched_conditions"]
    assert len(result["unmatched_conditions"]) == 0
    assert len(result["missing_information"]) == 0


def test_pm_kisan_eligibility(seeta_devi_profile, pm_kisan_scheme):
    result = SchemeEvaluator.evaluate(seeta_devi_profile, pm_kisan_scheme)
    assert result["status"] == "eligible"
    assert "occupation" in result["matched_conditions"]
    assert "landholding" in result["matched_conditions"]


def test_old_age_pension_not_eligible(seeta_devi_profile, old_age_pension_scheme):
    result = SchemeEvaluator.evaluate(seeta_devi_profile, old_age_pension_scheme)
    assert result["status"] == "not_eligible"
    assert "age" in result["unmatched_conditions"]
    assert "60 वर्ष" in result["explanation"]


def test_missing_information_leads_to_potentially_eligible():
    incomplete_profile = {
        "name": "कमला",
        "gender": "महिला",
        "marital_status": "विधवा",
        "state": "उत्तर प्रदेश"
        # age and income missing
    }
    scheme = {
        "id": "test_scheme",
        "scheme_name": "Test Scheme",
        "applicable_states": ["उत्तर प्रदेश"],
        "eligibility_conditions": {
            "min_age": 18,
            "max_annual_income": 100000,
            "states": ["उत्तर प्रदेश"]
        }
    }
    result = SchemeEvaluator.evaluate(incomplete_profile, scheme)
    assert result["status"] == "potentially_eligible"
    assert "age" in result["missing_information"]
    assert "annual_income" in result["missing_information"]
    assert len(result["unmatched_conditions"]) == 0

