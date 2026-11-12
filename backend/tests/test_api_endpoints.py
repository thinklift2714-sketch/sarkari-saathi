"""
End-to-End API tests for Sarkari Saathi FastAPI application.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["schemes_loaded"] >= 30
    assert "सीता देवी" in data["demo_persona"]


def test_get_profile():
    response = client.get("/api/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "सीता देवी"
    assert data["age"] == 52
    assert data["marital_status"] == "विधवा"
    assert data["state"] == "उत्तर प्रदेश"
    assert data["district"] == "वाराणसी"


def test_list_schemes():
    response = client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    scheme_ids = [s["id"] for s in data]
    assert "scheme_up_widow_pension" in scheme_ids
    assert "scheme_pm_kisan" in scheme_ids


def test_get_scheme_details():
    response = client.get("/api/schemes/scheme_up_widow_pension")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_name_hindi"] == "विधवा पेंशन योजना"
    assert data["department_hindi"] == "सामाजिक न्याय विभाग, उत्तर प्रदेश"
    assert "benefits" in data


def test_eligibility_evaluation():
    response = client.post("/api/eligibility/evaluate")
    assert response.status_code == 200
    data = response.json()
    summary = data["summary"]
    # Seeta Devi should match at least 4 schemes (Widow Pension, PM-Kisan, Ayushman Bharat, Ujjwala / MGNREGA)
    assert summary["eligible_count"] >= 4
    eligible_schemes = [s["scheme_name_hindi"] for s in data["results"]["eligible"]]
    assert any("विधवा पेंशन" in s for s in eligible_schemes)
    assert any("किसान" in s for s in eligible_schemes)


def test_document_checklist():
    response = client.get("/api/documents/checklist/scheme_up_widow_pension")
    assert response.status_code == 200
    data = response.json()
    assert data["scheme_name_hindi"] == "विधवा पेंशन योजना"
    assert data["total_count"] >= 5
    doc_names = [d["document_name_hindi"] for d in data["items"]]
    assert "आधार कार्ड" in doc_names
    assert "बैंक पासबुक" in doc_names


def test_update_document_status():
    response = client.put("/api/documents/status", json={
        "document_name": "आय प्रमाण पत्र",
        "status": "available"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Verify updated in checklist
    chk = client.get("/api/documents/checklist/scheme_up_widow_pension").json()
    income_doc = next(d for d in chk["items"] if d["document_name_hindi"] == "आय प्रमाण पत्र")
    assert income_doc["status"] == "available"


def test_conversation_flow_step1():
    # User message from reference image: "मेरे पति किसान थे और अब उनकी मृत्यु हो गई है।"
    response = client.post("/api/conversation/message", json={
        "message": "मेरे पति किसान थे और अब उनकी मृत्यु हो गई है।",
        "history": []
    })
    assert response.status_code == 200
    data = response.json()
    assert "उम्र" in data["message"] or "दुख" in data["message"]
    assert data["extracted_data"].get("marital_status") == "विधवा"


def test_conversation_flow_step2():
    # User provides age
    response = client.post("/api/conversation/message", json={
        "message": "मेरी उम्र 52 साल है।",
        "history": [
            {"role": "assistant", "content": "मुझे यह जानकर दुख हुआ। आपकी उम्र कितनी है?"}
        ],
        "current_profile": {"marital_status": "विधवा"}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["extracted_data"].get("age") == 52


def test_family_member_management():
    # Add daughter
    add_resp = client.post("/api/profile/members", json={
        "name": "आरती देवी",
        "relationship": "पुत्री",
        "age": 19,
        "occupation": "छात्रा"
    })
    assert add_resp.status_code == 200
    member_id = add_resp.json()["member"]["id"]

    # Delete
    del_resp = client.delete(f"/api/profile/members/{member_id}")
    assert del_resp.status_code == 200


def test_integrations_endpoints():
    # 1. Health check of government connectors
    resp = client.get("/api/integrations/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_status" in data
    assert "sources" in data
    assert len(data["sources"]) == 4
    source_ids = [s["source_id"] for s in data["sources"]]
    assert "myscheme_apisetu" in source_ids
    assert "data_gov_in" in source_ids
    assert "up_govt_portals" in source_ids

    # 2. Trigger sync
    sync_resp = client.post("/api/integrations/sync", json={})
    assert sync_resp.status_code == 200
    sync_data = sync_resp.json()
    assert sync_data["status"] == "completed"

