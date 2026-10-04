import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_01_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["platform"] == "UDYOGRATH (उद्योगरथ)"
    assert data["problem_statement"] == "SIH26130"

def test_02_login_and_demo_users():
    # Check demo users listing
    demo_resp = client.get("/api/auth/demo-users")
    assert demo_resp.status_code == 200
    users = demo_resp.json()
    assert len(users) >= 9

    # Login as applicant
    login_resp = client.post("/api/auth/login", json={"username": "applicant", "password": "Demo123!"})
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["role"] == "APPLICANT"

def test_03_enterprise_and_rules_evaluation():
    ent_resp = client.get("/api/enterprises/1")
    assert ent_resp.status_code == 200
    ent_data = ent_resp.json()
    assert ent_data["enterprise"]["name"] == "Sahyadri Precision Components Pvt. Ltd."
    assert ent_data["risk_profile"]["risk_category"] == "Standard"

    # Evaluate rules
    rules_resp = client.get("/api/rules/evaluate/1")
    assert rules_resp.status_code == 200
    rules_data = rules_resp.json()
    assert rules_data["total_required"] >= 8
    assert "timeline_comparison" in rules_data
    assert rules_data["timeline_comparison"]["days_saved"] > 0

def test_04_query_clock_pause_and_resume():
    # 1. Raise query on app 1
    raise_resp = client.post("/api/queries/raise", json={
        "application_id": 1,
        "category": "Technical Clarification",
        "query_text": "Smoke test query: please confirm power capacity."
    })
    assert raise_resp.status_code == 200
    raise_data = raise_resp.json()
    assert raise_data["clock_paused"] is True
    ticket_id = raise_data["ticket"]["id"]

    # 2. Respond to query
    respond_resp = client.post(f"/api/queries/{ticket_id}/respond", json={
        "response_text": "Confirmed 400 kW connected load with MSEDCL demand note."
    })
    assert respond_resp.status_code == 200
    respond_data = respond_resp.json()
    assert respond_data["clock_resumed"] is True

def test_05_audit_chain_verification():
    verify_resp = client.get("/api/audit/verify")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True
    assert verify_data["broken_sequence_no"] is None
