import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.analysis_service import analysis_service

client = TestClient(app)


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_start_analysis_endpoint():
    payload = {
        "user_input": "मेरी उम्र 52 वर्ष है और मेरे पति किसान थे जिनकी मृत्यु हो गई है। मैं वाराणसी में रहती हूँ।",
        "profile": {
            "name": "सीता देवी",
            "age": 52,
            "marital_status": "विधवा",
            "state": "उत्तर प्रदेश",
            "district": "वाराणसी",
            "annual_income": 45000.0,
            "occupation": "किसान की विधवा"
        }
    }
    resp = client.post("/api/schemes/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "analysis_id" in data
    assert data["status"] == "started"
    assert "/api/schemes/analyze/" in data["stream_url"]


@pytest.mark.anyio
async def test_analysis_service_execution_stream():
    aid = analysis_service.create_session(
        user_input="मेरी उम्र 65 साल है, मैं वृद्ध हूँ, मेरी वार्षिक आय 35000 रुपये है और मुझे पेंशन चाहिए।",
        profile={"state": "उत्तर प्रदेश", "age": 65, "occupation": "वरिष्ठ नागरिक", "annual_income": 35000.0}
    )
    stages_seen = []
    async for event_chunk in analysis_service.execute_and_stream(aid):
        if "stage_update" in event_chunk:
            stages_seen.append(event_chunk)

    # All 6 stages should have been streamed
    assert len(stages_seen) == 6
    session = analysis_service.get_session(aid)
    assert session.status == "completed"
    assert session.result is not None
    assert session.result["summary"]["eligible_count"] >= 1
    # Check old age pension is evaluated as eligible
    eligible_names = [s["scheme_name_hindi"] for s in session.result["results"]["eligible"]]
    assert any("वृद्धावस्था" in name for name in eligible_names)
