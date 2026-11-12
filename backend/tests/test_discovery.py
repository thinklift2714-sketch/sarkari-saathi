import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.discovery_service import discovery_service

client = TestClient(app)


def test_get_categories():
    response = client.get("/api/schemes/categories")
    assert response.status_code == 200
    cats = response.json()
    assert len(cats) >= 15
    codes = [c["code"] for c in cats]
    assert "agriculture" in codes
    assert "social_welfare" in codes
    assert "health" in codes
    assert "housing" in codes
    assert "education" in codes


def test_discover_schemes_default_profile():
    response = client.post("/api/schemes/discover", json={})
    assert response.status_code == 200
    data = response.json()
    summary = data["summary"]
    
    # Must find far more than 2 schemes!
    assert summary["total_evaluated"] >= 30
    assert summary["eligible_count"] >= 10
    assert summary["potentially_eligible_count"] >= 1
    assert summary["not_eligible_count"] >= 5
    
    # Should contain both central and UP state schemes
    assert summary["central_schemes_count"] > 0
    assert summary["state_schemes_count"] > 0

    results = data["results"]
    eligible_ids = [s["scheme_id"] for s in results["eligible"]]
    assert "scheme_up_widow_pension" in eligible_ids
    assert "scheme_pm_kisan" in eligible_ids
    assert "scheme_pm_jay" in eligible_ids
    assert "scheme_pm_ujjwala" in eligible_ids
    assert "scheme_pmay_g" in eligible_ids


def test_discover_schemes_with_category_filter():
    response = client.post("/api/schemes/discover", json={"category": "agriculture"})
    assert response.status_code == 200
    data = response.json()
    for s in data["results"]["eligible"]:
        assert s["category"] == "agriculture"


def test_discover_schemes_with_keyword_search():
    response = client.post("/api/schemes/discover", json={"search_query": "सोलर"})
    assert response.status_code == 200
    data = response.json()
    found_ids = [s["scheme_id"] for s in data["results"]["eligible"] + data["results"]["potentially_eligible"]]
    assert "scheme_pm_surya_ghar" in found_ids or "scheme_up_krishi_yantra" in found_ids


def test_conversation_endpoint_returns_dynamic_counts():
    payload = {
        "message": "मेरी उम्र 52 वर्ष है और मैं उत्तर प्रदेश वाराणसी में रहती हूँ। मेरे पति किसान थे जिनकी मृत्यु हो चुकी है।"
    }
    response = client.post("/api/conversation/message", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Matched count must be dynamic (> 2)
    assert data["matched_schemes_count"] is not None
    assert data["matched_schemes_count"] > 2
    assert "दो" not in data["message"]  # Should NOT say "two schemes"

