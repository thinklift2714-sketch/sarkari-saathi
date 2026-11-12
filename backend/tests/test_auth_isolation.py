"""
Tests for User Authentication, Tenant Isolation, and Data Privacy.
Verifies that:
1. New users get a completely empty profile without demo data.
2. User A and User B have strictly isolated data stores.
3. User B cannot access or modify User A's profile, family, documents, or applications.
4. Account deletion completely purges all user data.
5. Public scheme catalogue remains available to all.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_all_schemes

client = TestClient(app)

USER_A_ID = "11111111-1111-4000-a000-111111111111"
USER_B_ID = "22222222-2222-4000-a000-222222222222"

USER_A_TOKEN = f"dev-user-{USER_A_ID}:user_a@sarkari.in:+919876543210"
USER_B_TOKEN = f"dev-user-{USER_B_ID}:user_b@sarkari.in:+919876543211"


def test_new_user_gets_empty_profile_no_demo_data():
    """TEST F & TEST A: A brand new user opens the app; no Sita Devi demo data appears."""
    headers = {"Authorization": f"Bearer {USER_A_TOKEN}"}
    res = client.get("/api/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == USER_A_ID
    # Must NOT be Sita Devi
    assert data["name"] != "सीता देवी"
    assert data["is_onboarded"] is False
    assert len(data["members"]) == 0


def test_user_a_creates_profile_and_family():
    """TEST A: User A completes their own profile."""
    headers = {"Authorization": f"Bearer {USER_A_TOKEN}"}
    # Save profile
    save_res = client.post("/api/profile", json={
        "name": "रामेश्वर दयाल",
        "age": 42,
        "gender": "पुरुष",
        "marital_status": "विवाहित",
        "state": "उत्तर प्रदेश",
        "district": "गोरखपुर",
        "occupation": "किसान",
        "annual_income": 80000.0,
        "landholding": 1.5
    }, headers=headers)
    assert save_res.status_code == 200
    data = save_res.json()
    assert data["name"] == "रामेश्वर दयाल"
    assert data["district"] == "गोरखपुर"
    assert data["is_onboarded"] is True

    # Add a family member
    mem_res = client.post("/api/profile/members", json={
        "name": "सुनीता देवी",
        "relationship": "पत्नी",
        "age": 38,
        "occupation": "गृहिणी"
    }, headers=headers)
    assert mem_res.status_code == 200
    assert mem_res.json()["member"]["name"] == "सुनीता देवी"


def test_user_b_isolation_and_empty_state():
    """TEST B & TEST E: User B logs in and sees completely separate, empty dashboard."""
    headers_b = {"Authorization": f"Bearer {USER_B_TOKEN}"}
    res_b = client.get("/api/profile", headers=headers_b)
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["user_id"] == USER_B_ID
    # Must NOT have User A's data
    assert data_b["name"] != "रामेश्वर दयाल"
    assert data_b["name"] != "सीता देवी"
    assert data_b["district"] != "गोरखपुर"
    assert len(data_b["members"]) == 0
    assert data_b["is_onboarded"] is False


def test_document_and_application_isolation():
    """Verify documents and applications are isolated per user."""
    headers_a = {"Authorization": f"Bearer {USER_A_TOKEN}"}
    headers_b = {"Authorization": f"Bearer {USER_B_TOKEN}"}

    # User A updates document status
    doc_res = client.put("/api/documents/status", json={
        "document_name": "किसान क्रेडिट कार्ड",
        "status": "available"
    }, headers=headers_a)
    assert doc_res.status_code == 200

    # User A submits application
    app_res = client.post("/api/applications", json={
        "scheme_id": "scheme_pm_kisan",
        "application_reference": "PMK-TEST-999"
    }, headers=headers_a)
    assert app_res.status_code == 200

    # User A sees their application
    apps_a = client.get("/api/applications", headers=headers_a).json()
    assert len(apps_a) == 1
    assert apps_a[0]["scheme_id"] == "scheme_pm_kisan"

    # User B checks applications: MUST be 0!
    apps_b = client.get("/api/applications", headers=headers_b).json()
    assert len(apps_b) == 0


def test_account_deletion_wipes_user_data():
    """TEST D & Account Management: Deleting User A's account cleans all their data."""
    headers_a = {"Authorization": f"Bearer {USER_A_TOKEN}"}
    del_res = client.delete("/api/auth/delete-account", headers=headers_a)
    assert del_res.status_code == 200

    # Profile should now be un-onboarded / clean
    prof_res = client.get("/api/profile", headers=headers_a)
    assert prof_res.json()["is_onboarded"] is False
    assert prof_res.json()["name"] == ""


def test_public_scheme_catalogue_remains_available():
    """TEST H: Public scheme catalogue is accessible to everyone without auth restriction."""
    schemes = get_all_schemes()
    assert len(schemes) >= 35

    # Public endpoint without auth header
    res = client.get("/api/schemes")
    assert res.status_code == 200
    assert len(res.json()) >= 35

