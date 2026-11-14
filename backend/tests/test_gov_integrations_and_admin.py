"""
Tests for Government Scheme Data API Integration, Verified Registry,
Scheme-Specific Document Checklists, Application Guides, and Admin Management.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_scheme_specific_document_checklist_widow_pension():
    """
    Verify that Widow Pension checklist returns verified scheme-specific
    why_needed explanations (not generic text).
    """
    res = client.get("/api/documents/checklist/scheme_up_widow_pension")
    assert res.status_code == 200
    data = res.json()
    assert data["scheme_id"] == "scheme_up_widow_pension"
    assert data["total_count"] >= 5

    # Check that husband's death cert has scheme-specific reason
    death_cert = next(
        (it for it in data["items"] if "मृत्यु प्रमाण पत्र" in it["document_name_hindi"]),
        None
    )
    assert death_cert is not None
    assert "widow" in death_cert["why_needed"].lower() or "विधवा" in death_cert["why_needed_hindi"]
    assert death_cert["is_mandatory"] is True


def test_scheme_specific_document_checklist_pm_kisan():
    """
    Verify that PM Kisan checklist returns land record (Khatauni) with farming reason.
    """
    res = client.get("/api/documents/checklist/scheme_pm_kisan")
    assert res.status_code == 200
    data = res.json()
    assert data["scheme_id"] == "scheme_pm_kisan"

    khatauni = next(
        (it for it in data["items"] if "खतौनी" in it["document_name_hindi"] or "Land" in it["document_name"]),
        None
    )
    assert khatauni is not None
    assert "भूमि" in khatauni["why_needed_hindi"] or "land" in khatauni["why_needed"].lower()


def test_scheme_specific_application_guide():
    """
    Verify that /api/applications/guide/{scheme_id} returns verified application
    procedure, official portal link, application mode, fees, and steps.
    """
    res = client.get("/api/applications/guide/scheme_pm_kisan")
    assert res.status_code == 200
    data = res.json()
    assert data["scheme_id"] == "scheme_pm_kisan"
    assert data["application_mode"] in ["both", "online", "offline"]
    assert "pmkisan.gov.in" in data["official_website"]
    assert data["data_verification_status"] == "verified"
    assert "निःशुल्क" in data["application_fees"] or "Free" in data["application_fees"]
    assert len(data["steps"]) >= 3
    assert len(data["nearby_centers"]) >= 1


def test_admin_scheme_management_crud():
    """
    Verify Admin CRUD: list schemes, create scheme, update, verify, and delete.
    """
    # 1. Admin List
    list_res = client.get("/api/admin/schemes")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 30

    # 2. Admin Create
    new_scheme_payload = {
        "id": "scheme_test_welfare_grant",
        "scheme_name": "Test Welfare Grant Scheme",
        "scheme_name_hindi": "परीक्षण कल्याण अनुदान योजना",
        "description": "Test scheme for administrative verification",
        "description_hindi": "प्रशासनिक सत्यापन हेतु परीक्षण योजना",
        "department": "Department of Social Justice",
        "department_hindi": "सामाजिक न्याय विभाग",
        "category": "social_welfare",
        "category_hindi": "सामाजिक सुरक्षा",
        "central_or_state": "central",
        "benefits": {"amount": 5000, "description_hindi": "एकमुश्त ₹5,000"},
        "eligibility_conditions": {"min_age": 18, "max_annual_income": 100000},
        "required_documents": ["आधार कार्ड", "आय प्रमाण पत्र"],
        "official_website": "https://india.gov.in",
        "application_mode": "online",
        "application_fees": "निःशुल्क (₹0 / Free)",
        "application_deadline": "वर्ष भर खुला (Ongoing)",
        "data_verification_status": "verified"
    }
    create_res = client.post("/api/admin/schemes", json=new_scheme_payload)
    assert create_res.status_code == 201
    assert create_res.json()["status"] == "success"

    # 3. Admin Get
    get_res = client.get("/api/admin/schemes/scheme_test_welfare_grant")
    assert get_res.status_code == 200
    assert get_res.json()["scheme_name_hindi"] == "परीक्षण कल्याण अनुदान योजना"

    # 4. Admin Update
    update_res = client.put("/api/admin/schemes/scheme_test_welfare_grant", json={
        "application_fees": "निःशुल्क (Free of cost)"
    })
    assert update_res.status_code == 200
    assert update_res.json()["scheme"]["application_fees"] == "निःशुल्क (Free of cost)"

    # 5. Admin Verify
    verify_res = client.post("/api/admin/schemes/scheme_test_welfare_grant/verify", json={
        "verifier_name": "SuperAdmin",
        "notes": "Verified against Gazette notification"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["scheme"]["data_verification_status"] == "verified"

    # 6. Admin Delete
    del_res = client.delete("/api/admin/schemes/scheme_test_welfare_grant")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"


def test_admin_sync_logs_and_trigger():
    """
    Verify that synchronization logs and triggers operate correctly.
    """
    # Check sync status
    status_res = client.get("/api/admin/sync/status")
    assert status_res.status_code == 200
    assert "sources" in status_res.json()

    # Trigger sync
    sync_res = client.post("/api/admin/sync/trigger")
    assert sync_res.status_code == 200
    assert sync_res.json()["status"] == "completed"

    # Read sync audit logs
    logs_res = client.get("/api/admin/sync/logs")
    assert logs_res.status_code == 200
    assert len(logs_res.json()) >= 1
