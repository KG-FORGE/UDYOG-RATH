import pytest
from pathlib import Path
from datetime import date
from backend.services.readiness import validate_document, calculate_overall_readiness
from backend.models.approval import ApprovalItem, DocumentRequirement

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"

def test_01_valid_pan_document_passes():
    pan_file = SAMPLES_DIR / "sahyadri_pan.pdf"
    assert pan_file.exists()

    res = validate_document(
        file_path=str(pan_file),
        doc_code="PAN_CARD",
        profile_name="Sahyadri Precision Components Pvt. Ltd.",
        profile_pan="AABCS1234F",
        profile_pin="410501"
    )
    assert res["status"] == "Pass"
    assert res["name_match_score"] >= 85.0
    assert not res["is_expired"]
    assert res["readiness_contribution"] >= 90.0

def test_02_mismatched_name_triggers_warning_or_fail():
    flawed_file = SAMPLES_DIR / "sahyadri_mismatched_doc.pdf"
    assert flawed_file.exists()

    res = validate_document(
        file_path=str(flawed_file),
        doc_code="PREMISES_PROOF",
        profile_name="Sahyadri Precision Components Pvt. Ltd.",
        profile_pan="AABCS1234F",
        profile_pin="410501"
    )
    # The document has "Sahyadri Precision Comp."
    assert res["name_match_score"] < 85.0
    assert res["status"] in ["Warning", "Fail"]
    assert any("differs from enterprise profile" in issue["issue"] for issue in res["issues"])
    assert any("fix" in issue for issue in res["issues"])

def test_03_expired_certificate_triggers_fail():
    expired_file = SAMPLES_DIR / "sahyadri_expired_cert.pdf"
    assert expired_file.exists()

    res = validate_document(
        file_path=str(expired_file),
        doc_code="STABILITY_CERT",
        profile_name="Sahyadri Precision Components Pvt. Ltd.",
        system_date=date(2026, 1, 1)
    )
    assert res["is_expired"] is True
    assert res["status"] == "Fail"
    assert any("expired" in issue["issue"].lower() for issue in res["issues"])

def test_04_readiness_score_blocks_submit_below_80():
    req1 = DocumentRequirement(code="DOC1", name="Doc 1", mandatory=True)
    req2 = DocumentRequirement(code="DOC2", name="Doc 2", mandatory=True)
    app = ApprovalItem(
        id="APP1", name="Test App", authority="Auth", department_code="GEN",
        legal_basis_label="Law", why_required="Why", prerequisites=[], parallel_group="G1",
        sla_days=10, sla_standard=10, sla_fast_track=5, fee_label="Nil", documents=[req1, req2]
    )

    # When no documents are uploaded, score is 0
    res_empty = calculate_overall_readiness([app], [])
    assert res_empty["overall_score"] < 80.0
    assert res_empty["can_submit"] is False
