"""
Comprehensive Test: Realistic Citizen Profile (Ramesh Kumar, Farmer from Meerut, UP)
Evaluates discovery across multiple welfare categories:
- Farmer welfare (PM-KISAN, KCC, Soil Health Card, PMFBY)
- State farmer welfare (UP Krishak Durghatna, UP Krishi Yantra)
- Children's education (UP Pre-Matric Scholarship, PM YASASVI)
- Health benefits (Ayushman Bharat PM-JAY)
- Food security & household welfare (NFSA Ration, Swachh Bharat)
"""
import pytest
from app.services.discovery_service import discovery_service

RAMESH_KUMAR_PROFILE = {
    "name": "रमेश कुमार",
    "age": 45,
    "gender": "पुरुष",
    "marital_status": "विवाहित",
    "state": "उत्तर प्रदेश",
    "district": "मेरठ",
    "village_or_town": "दौराला",
    "occupation": "किसान",
    "annual_income": 75000.0,
    "family_size": 5,
    "has_bank_account": True,
    "landholding": 1.5,
    "caste_category": "सामान्य / अन्य",
    "is_student": False,
    "has_disability": False,
    "current_benefits": ["राशन कार्ड"],
    "members": [
        {
            "id": "mem_1",
            "name": "रमेश कुमार",
            "relationship": "मुख्य सदस्य",
            "age": 45,
            "occupation": "किसान"
        },
        {
            "id": "mem_2",
            "name": "सुनीता देवी",
            "relationship": "पत्नी",
            "age": 40,
            "occupation": "गृहिणी"
        },
        {
            "id": "mem_3",
            "name": "अजय कुमार",
            "relationship": "पुत्र",
            "age": 16,
            "occupation": "छात्र"
        },
        {
            "id": "mem_4",
            "name": "विजय कुमार",
            "relationship": "पुत्र",
            "age": 12,
            "occupation": "छात्र"
        },
        {
            "id": "mem_5",
            "name": "रामफल",
            "relationship": "पिता",
            "age": 72,
            "occupation": "वृद्ध"
        }
    ]
}


def test_ramesh_kumar_discovery_multi_category():
    """
    Ramesh Kumar is a 45-year-old farmer from Meerut, UP with school-going children.
    The discovery system must discover multiple relevant schemes across sectors,
    NOT just 2 schemes.
    """
    res = discovery_service.discover_schemes(profile=RAMESH_KUMAR_PROFILE)
    summary = res["summary"]
    results = res["results"]

    # 1. Verification: Should evaluate all 35 schemes
    assert summary["total_evaluated"] >= 30, f"Expected 30+ evaluated, got {summary['total_evaluated']}"

    # 2. Verification: More than 2 schemes must be eligible / potentially eligible
    eligible = results["eligible"]
    potentially_eligible = results["potentially_eligible"]
    total_relevant = len(eligible) + len(potentially_eligible)
    assert total_relevant >= 8, f"Expected at least 8 relevant schemes, got {total_relevant}"

    # 3. Check specific key schemes for a farmer with land in UP
    eligible_ids = {s["scheme_id"] for s in eligible}
    potential_ids = {s["scheme_id"] for s in potentially_eligible}
    all_matched = eligible_ids.union(potential_ids)

    # Core Agricultural Welfare
    assert "scheme_pm_kisan" in all_matched, "PM-KISAN must be matched for landholding farmer"
    assert "scheme_kcc" in all_matched, "KCC credit card must be matched for farmer"
    assert "scheme_pmfby" in all_matched, "PM Crop Insurance must be matched"
    assert "scheme_soil_health_card" in all_matched, "Soil Health Card must be matched"
    assert "scheme_up_krishi_yantra" in all_matched, "UP Krishi Yantra subsidy must be matched"
    assert "scheme_up_krishak_durghatna" in all_matched, "UP Krishak Durghatna must be matched"

    # Health & Sanitation
    assert "scheme_pm_jay" in all_matched, "Ayushman Bharat must be evaluated for income 75k"
    assert "scheme_swachh_bharat_ihhl" in all_matched, "Swachh Bharat IHHL must be matched"

    # Education (Children are students)
    assert "scheme_up_scholarship_post" in all_matched or "scheme_up_scholarship_pre" in all_matched, \
        "Scholarship must be matched for student children"

    # 4. Check that ineligible schemes are correctly classified
    not_eligible_ids = {s["scheme_id"] for s in results["not_eligible"]}
    assert "scheme_up_widow_pension" in not_eligible_ids, "Widow pension should be not eligible for married male"
    assert "scheme_pm_kisan_maandhan" in not_eligible_ids or "scheme_atal_pension" in not_eligible_ids, \
        "Schemes with max age 40 should be not eligible for 45yo Ramesh Kumar"

    # 5. Check official source citations
    for s in eligible[:5]:
        assert s.get("official_source") or s.get("official_website"), f"Scheme {s['scheme_id']} missing official source"
        assert s.get("disclaimer"), f"Scheme {s['scheme_id']} missing legal disclaimer"

    # 6. Check central and state representation
    assert summary["central_schemes_count"] >= 3, "Must include central schemes"
    assert summary["state_schemes_count"] >= 2, "Must include UP state schemes"


def test_ramesh_kumar_category_filtering():
    """Verify category filtering works specifically for Ramesh Kumar."""
    agri_res = discovery_service.discover_schemes(profile=RAMESH_KUMAR_PROFILE, category="agriculture")
    for s in agri_res["results"]["eligible"]:
        assert s.get("category") == "agriculture"
