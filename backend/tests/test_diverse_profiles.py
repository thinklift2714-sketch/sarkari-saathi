import pytest
from app.services.discovery_service import discovery_service


def test_student_profile_discovery():
    student_profile = {
        "name": "अमित वर्मा",
        "age": 19,
        "gender": "पुरुष",
        "marital_status": "अविवाहित",
        "state": "उत्तर प्रदेश",
        "district": "वाराणसी",
        "occupation": "छात्र",
        "is_student": True,
        "annual_income": 120000.0
    }
    disc = discovery_service.discover_schemes(student_profile)
    eligible = [s["scheme_name_hindi"] for s in disc["results"]["eligible"]]
    potential = [s["scheme_name_hindi"] for s in disc["results"]["potentially_eligible"]]
    all_matched = eligible + potential

    # Should match scholarships
    assert any("छात्रवृत्ति" in name or "यशस्वी" in name for name in all_matched)
    # MUST NOT recommend widow pension to a male unmarried student!
    assert not any("विधवा" in name for name in eligible)


def test_senior_citizen_discovery():
    senior_profile = {
        "name": "दीनानाथ यादव",
        "age": 68,
        "gender": "पुरुष",
        "marital_status": "विवाहित",
        "state": "उत्तर प्रदेश",
        "district": "गोरखपुर",
        "occupation": "वरिष्ठ नागरिक",
        "annual_income": 36000.0
    }
    disc = discovery_service.discover_schemes(senior_profile)
    eligible = [s["scheme_name_hindi"] for s in disc["results"]["eligible"]]
    
    # Should be eligible for Old Age Pension
    assert any("वृद्धावस्था पेंशन" in name for name in eligible)
    # MUST NOT recommend widow pension or maternity benefits
    assert not any("विधवा" in name for name in eligible)
    assert not any("मातृ वंदना" in name for name in eligible)


def test_farmer_discovery():
    farmer_profile = {
        "name": "सुरेश चंद्र",
        "age": 42,
        "gender": "पुरुष",
        "marital_status": "विवाहित",
        "state": "उत्तर प्रदेश",
        "district": "प्रयागराज",
        "occupation": "किसान",
        "landholding": 1.5,
        "annual_income": 85000.0
    }
    disc = discovery_service.discover_schemes(farmer_profile)
    eligible = [s["scheme_name_hindi"] for s in disc["results"]["eligible"]]
    
    # Should match farming schemes
    assert any("किसान सम्मान निधि" in name or "केसीसी" in name or "फसल बीमा" in name for name in eligible)
    # MUST NOT recommend widow pension
    assert not any("विधवा" in name for name in eligible)

