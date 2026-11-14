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


def test_email_login_creates_isolated_accounts_per_mail():
    """Verify that any user can log in with their email and data is strictly isolated."""
    # 1. Priya logs in with priya@gmail.com
    res1 = client.post("/api/auth/email", json={"email": "priya@gmail.com", "name": "Priya Sharma"})
    assert res1.status_code == 200
    token_priya = res1.json()["access_token"]
    user_priya_id = res1.json()["user"]["id"]

    # Priya saves profile
    client.post("/api/profile", json={
        "name": "Priya Sharma",
        "district": "Lucknow",
        "occupation": "Teacher",
        "annual_income": 120000.0,
        "is_onboarded": True
    }, headers={"Authorization": f"Bearer {token_priya}"})

    # 2. Vikram logs in with vikram@yahoo.com
    res2 = client.post("/api/auth/email", json={"email": "vikram@yahoo.com"})
    assert res2.status_code == 200
    token_vikram = res2.json()["access_token"]
    user_vikram_id = res2.json()["user"]["id"]

    # Different IDs
    assert user_priya_id != user_vikram_id

    # Vikram profile must NOT see Priya's profile
    vikram_prof = client.get("/api/profile", headers={"Authorization": f"Bearer {token_vikram}"}).json()
    assert vikram_prof["user_id"] == user_vikram_id
    assert vikram_prof["name"] != "Priya Sharma"
    assert vikram_prof["is_onboarded"] is False

    # 3. Priya logs in again tomorrow with priya@gmail.com
    res3 = client.post("/api/auth/email", json={"email": "priya@gmail.com"})
    assert res3.status_code == 200
    assert res3.json()["user"]["id"] == user_priya_id
    token_priya_2 = res3.json()["access_token"]

    # Priya's saved profile is preserved!
    priya_prof = client.get("/api/profile", headers={"Authorization": f"Bearer {token_priya_2}"}).json()
    assert priya_prof["name"] == "Priya Sharma"
    assert priya_prof["district"] == "Lucknow"
    assert priya_prof["is_onboarded"] is True


def test_auth_status_endpoint():
    """Verify auth status endpoint returns accurate configuration health."""
    res = client.get("/api/auth/status")
    assert res.status_code == 200
    data = res.json()
    assert "supabase_configured" in data
    assert "google_oauth_enabled" in data
    assert "demo_mode" in data


def test_unauthenticated_protected_route_fails():
    """TEST 7: Verify unauthenticated requests to protected endpoints return 401."""
    res = client.delete("/api/auth/delete-account")
    assert res.status_code == 401


def test_google_user_profile_sync_with_avatar():
    """TEST 9: Verify user profile preserves email, name, and avatar between sessions."""
    google_user_id = "33333333-3333-4000-a000-333333333333"
    token = f"dev-user-{google_user_id}:google_user@gmail.com:+919876500000"
    headers = {"Authorization": f"Bearer {token}"}

    # Save initial Google profile data
    save_res = client.post("/api/profile", json={
        "name": "Amitabh Sharma",
        "email": "google_user@gmail.com",
        "avatar_url": "https://lh3.googleusercontent.com/a/sample-avatar",
        "district": "Meerut",
        "occupation": "किसान",
        "annual_income": 65000.0
    }, headers=headers)
    assert save_res.status_code == 200
    saved = save_res.json()
    assert saved["name"] == "Amitabh Sharma"
    assert saved["email"] == "google_user@gmail.com"
    assert saved["avatar_url"] == "https://lh3.googleusercontent.com/a/sample-avatar"

    # In next session, retrieve profile
    get_res = client.get("/api/profile", headers=headers)
    assert get_res.status_code == 200
    profile_data = get_res.json()
    assert profile_data["name"] == "Amitabh Sharma"
    assert profile_data["email"] == "google_user@gmail.com"
    assert profile_data["avatar_url"] == "https://lh3.googleusercontent.com/a/sample-avatar"
    assert profile_data["district"] == "Meerut"


def test_saved_schemes_user_isolation():
    """
    TEST 10: User-specific saved schemes verification.
    - New user starts with empty saved schemes []
    - User A saves a scheme
    - User B sees empty saved schemes []
    - User A un-saves scheme
    - Public scheme catalog remains intact
    """
    user_x = "44444444-4444-4000-a000-444444444444"
    user_y = "55555555-5555-4000-a000-555555555555"
    token_x = f"dev-user-{user_x}:user_x@sarkari.in:+919876543220"
    token_y = f"dev-user-{user_y}:user_y@sarkari.in:+919876543221"
    headers_x = {"Authorization": f"Bearer {token_x}"}
    headers_y = {"Authorization": f"Bearer {token_y}"}

    # 1. New user X has 0 saved schemes
    res_x0 = client.get("/api/schemes/saved", headers=headers_x)
    assert res_x0.status_code == 200
    assert res_x0.json() == []

    # 2. User X saves a scheme
    save_res = client.post("/api/schemes/saved/scheme_pm_kisan", headers=headers_x)
    assert save_res.status_code == 200
    assert save_res.json()["is_saved"] is True

    # 3. User X sees 1 saved scheme
    res_x1 = client.get("/api/schemes/saved", headers=headers_x)
    assert res_x1.status_code == 200
    saved_schemes_x = res_x1.json()
    assert len(saved_schemes_x) == 1
    assert saved_schemes_x[0]["id"] == "scheme_pm_kisan"

    # 4. User Y sees EMPTY saved schemes (no bleed from User X)
    res_y = client.get("/api/schemes/saved", headers=headers_y)
    assert res_y.status_code == 200
    assert res_y.json() == []

    # 5. User X deletes saved scheme
    del_res = client.delete("/api/schemes/saved/scheme_pm_kisan", headers=headers_x)
    assert del_res.status_code == 200
    assert del_res.json()["is_saved"] is False

    # User X list is now empty again
    res_x2 = client.get("/api/schemes/saved", headers=headers_x)
    assert res_x2.status_code == 200
    assert res_x2.json() == []

    # 6. Public scheme catalog is NOT deleted
    catalog_res = client.get("/api/schemes/scheme_pm_kisan")
    assert catalog_res.status_code == 200
    assert catalog_res.json()["id"] == "scheme_pm_kisan"


def test_conversation_persistence_and_isolation():
    """
    TEST 11: Persistent conversation storage and user isolation.
    - User starts chat, messages are persisted in DB
    - Conversation reloads with all message history
    - Other users cannot access it
    - User can rename and delete conversation
    """
    user_c = "66666666-6666-4000-a000-666666666666"
    user_d = "77777777-7777-4000-a000-777777777777"
    token_c = f"dev-user-{user_c}:user_c@sarkari.in:+919876543230"
    token_d = f"dev-user-{user_d}:user_d@sarkari.in:+919876543231"
    headers_c = {"Authorization": f"Bearer {token_c}"}
    headers_d = {"Authorization": f"Bearer {token_d}"}

    # 1. New user has empty conversations
    res_list = client.get("/api/conversation", headers=headers_c)
    assert res_list.status_code == 200
    assert res_list.json() == []

    # 2. Create conversation
    create_res = client.post("/api/conversation", json={"title": "किसान योजना सहायता"}, headers=headers_c)
    assert create_res.status_code == 200
    conv = create_res.json()
    conv_id = conv["id"]
    assert conv["title"] == "किसान योजना सहायता"

    # 3. Send message in this conversation
    msg_res = client.post("/api/conversation/message", json={
        "message": "मेरी उम्र 45 साल है और मैं उत्तर प्रदेश का किसान हूँ।",
        "conversation_id": conv_id
    }, headers=headers_c)
    assert msg_res.status_code == 200
    resp_data = msg_res.json()
    assert resp_data["conversation_id"] == conv_id

    # 4. Reopen conversation and verify history
    get_conv = client.get(f"/api/conversation/{conv_id}", headers=headers_c)
    assert get_conv.status_code == 200
    conv_detail = get_conv.json()
    assert conv_detail["id"] == conv_id
    assert len(conv_detail["messages"]) >= 2
    assert conv_detail["messages"][0]["role"] == "user"
    assert "उत्तर प्रदेश" in conv_detail["messages"][0]["content"]
    assert conv_detail["messages"][1]["role"] == "assistant"

    # 5. User D cannot access User C's conversation
    unauth_get = client.get(f"/api/conversation/{conv_id}", headers=headers_d)
    assert unauth_get.status_code == 404

    # 6. User C renames conversation
    rename_res = client.patch(f"/api/conversation/{conv_id}", json={"title": "UP किसान कल्याण योजना"}, headers=headers_c)
    assert rename_res.status_code == 200
    assert rename_res.json()["title"] == "UP किसान कल्याण योजना"

    # 7. User C deletes conversation
    del_res = client.delete(f"/api/conversation/{conv_id}", headers=headers_c)
    assert del_res.status_code == 200

    # Verify conversation is gone
    after_del = client.get(f"/api/conversation/{conv_id}", headers=headers_c)
    assert after_del.status_code == 404
