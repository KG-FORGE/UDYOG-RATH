import os
import json
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.config import settings, SAMPLES_DIR
from backend.app.database import get_session
from backend.models.enterprise import EnterpriseProfile
from backend.models.document import UploadedDocument
from backend.services.rules_engine import rules_engine
from backend.services.readiness import validate_document, calculate_overall_readiness
from backend.services.audit import append_audit_entry
from backend.services.sla import get_current_system_time

router = APIRouter(prefix="/api/documents", tags=["Documents & Readiness"])

UPLOAD_STORAGE_DIR = settings.DATA_DIR / "uploads"
UPLOAD_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

class OverrideSubmitRequest(BaseModel):
    enterprise_id: int
    override_reason: str
    consent_acknowledged: bool

class ManualFieldUpdateRequest(BaseModel):
    document_id: int
    extracted_name: str
    extracted_pan: Optional[str] = None
    extracted_pin: Optional[str] = None

@router.get("/enterprise/{enterprise_id}")
def list_enterprise_documents(enterprise_id: int, session: Session = Depends(get_session)):
    docs = session.exec(select(UploadedDocument).where(UploadedDocument.enterprise_id == enterprise_id)).all()
    result = []
    for d in docs:
        issues = []
        try:
            issues = json.loads(d.validation_issues_json)
        except Exception:
            pass
        result.append({
            "id": d.id,
            "enterprise_id": d.enterprise_id,
            "approval_id": d.approval_id,
            "document_code": d.document_code,
            "document_name": d.document_name,
            "filename": d.filename,
            "file_size_bytes": d.file_size_bytes,
            "validation_status": d.validation_status,
            "name_match_score": d.name_match_score,
            "is_expired": d.is_expired,
            "readiness_score_contribution": d.readiness_score_contribution,
            "issues": issues,
            "extracted_fields": {
                "enterprise_name": d.extracted_enterprise_name,
                "pan": d.extracted_pan,
                "pin_code": d.extracted_pin_code,
                "expiry_date": d.extracted_expiry_date
            },
            "is_vault_reused": d.is_vault_reused,
            "vault_consent_granted": d.vault_consent_granted,
            "created_at": d.created_at.isoformat()
        })
    return result

@router.get("/readiness/{enterprise_id}")
def get_enterprise_readiness(enterprise_id: int, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    profile_dict = {
        "sector": ent.sector, "stage": ent.stage, "investment_cr": ent.investment_cr,
        "employees": ent.employees, "power_kw": ent.power_kw, "water_kld": ent.water_kld,
        "district": ent.district, "is_midc": ent.is_midc, "hazardous": ent.hazardous,
        "effluent": ent.effluent, "boiler": ent.boiler, "storage_flammables": ent.storage_flammables,
        "export_activity": ent.export_activity, "risk_category": ent.risk_category
    }

    approvals = rules_engine.evaluate_profile(profile_dict)
    uploaded = session.exec(select(UploadedDocument).where(UploadedDocument.enterprise_id == enterprise_id)).all()

    readiness = calculate_overall_readiness(approvals, uploaded)
    return readiness

@router.post("/upload")
async def upload_document(
    enterprise_id: int = Form(...),
    approval_id: str = Form(...),
    document_code: str = Form(...),
    document_name: str = Form(...),
    is_vault_reused: bool = Form(False),
    vault_consent_granted: bool = Form(False),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    dest_folder = UPLOAD_STORAGE_DIR / str(enterprise_id) / approval_id
    dest_folder.mkdir(parents=True, exist_ok=True)
    file_dest = dest_folder / file.filename

    with open(file_dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_dest)

    # Run full readiness validation
    system_date = get_current_system_time().date()
    val_res = validate_document(
        file_path=str(file_dest),
        doc_code=document_code,
        profile_name=ent.name,
        profile_pan=ent.pan,
        profile_pin=ent.pin_code,
        system_date=system_date
    )

    # Check for existing document record for this slot
    stmt = select(UploadedDocument).where(
        UploadedDocument.enterprise_id == enterprise_id,
        UploadedDocument.approval_id == approval_id,
        UploadedDocument.document_code == document_code
    )
    existing_doc = session.exec(stmt).first()

    extracted = val_res.get("extracted_fields", {})

    if existing_doc:
        existing_doc.filename = file.filename
        existing_doc.file_path = str(file_dest)
        existing_doc.file_size_bytes = file_size
        existing_doc.extracted_enterprise_name = extracted.get("enterprise_name")
        existing_doc.extracted_pan = extracted.get("pan")
        existing_doc.extracted_pin_code = extracted.get("pin_code")
        existing_doc.extracted_expiry_date = val_res.get("expiry_date")
        existing_doc.validation_status = val_res.get("status", "Pass")
        existing_doc.name_match_score = val_res.get("name_match_score", 100.0)
        existing_doc.is_expired = val_res.get("is_expired", False)
        existing_doc.validation_issues_json = json.dumps(val_res.get("issues", []))
        existing_doc.readiness_score_contribution = val_res.get("readiness_contribution", 100.0)
        existing_doc.is_vault_reused = is_vault_reused
        existing_doc.vault_consent_granted = vault_consent_granted
        doc = existing_doc
    else:
        doc = UploadedDocument(
            enterprise_id=enterprise_id,
            approval_id=approval_id,
            document_code=document_code,
            document_name=document_name,
            filename=file.filename,
            file_path=str(file_dest),
            file_size_bytes=file_size,
            extracted_enterprise_name=extracted.get("enterprise_name"),
            extracted_pan=extracted.get("pan"),
            extracted_pin_code=extracted.get("pin_code"),
            extracted_expiry_date=val_res.get("expiry_date"),
            validation_status=val_res.get("status", "Pass"),
            name_match_score=val_res.get("name_match_score", 100.0),
            is_expired=val_res.get("is_expired", False),
            validation_issues_json=json.dumps(val_res.get("issues", [])),
            readiness_score_contribution=val_res.get("readiness_contribution", 100.0),
            is_vault_reused=is_vault_reused,
            vault_consent_granted=vault_consent_granted
        )
        session.add(doc)

    session.commit()
    session.refresh(doc)

    # Append audit trail
    append_audit_entry(
        session=session,
        actor="applicant",
        role="APPLICANT",
        action="DOCUMENT_UPLOADED_AND_VALIDATED",
        resource_type="Document",
        resource_id=str(doc.id),
        details=f"Uploaded {file.filename} for {approval_id}. Result: {doc.validation_status} (Name match: {doc.name_match_score}%)."
    )

    return {
        "status": "success",
        "document_id": doc.id,
        "validation_status": doc.validation_status,
        "name_match_score": doc.name_match_score,
        "is_expired": doc.is_expired,
        "issues": val_res.get("issues", []),
        "extracted_fields": extracted,
        "readiness_score_contribution": doc.readiness_score_contribution
    }

@router.post("/update-extracted-fields")
def update_extracted_fields(req: ManualFieldUpdateRequest, session: Session = Depends(get_session)):
    doc = session.get(UploadedDocument, req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ent = session.get(EnterpriseProfile, doc.enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    doc.extracted_enterprise_name = req.extracted_name
    if req.extracted_pan:
        doc.extracted_pan = req.extracted_pan
    if req.extracted_pin:
        doc.extracted_pin_code = req.extracted_pin

    # Re-evaluate name match
    from rapidfuzz import fuzz
    score_sort = fuzz.token_sort_ratio(req.extracted_name.lower(), ent.name.lower())
    score_set = fuzz.token_set_ratio(req.extracted_name.lower(), ent.name.lower())
    doc.name_match_score = round(max(score_sort, score_set), 1)

    if doc.name_match_score >= 85.0 and not doc.is_expired:
        doc.validation_status = "Pass"
        doc.validation_issues_json = "[]"
        doc.readiness_score_contribution = 100.0

    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {
        "status": "success",
        "validation_status": doc.validation_status,
        "name_match_score": doc.name_match_score,
        "readiness_score_contribution": doc.readiness_score_contribution
    }

@router.post("/seed-samples-for-enterprise/{enterprise_id}")
def attach_sample_documents(enterprise_id: int, session: Session = Depends(get_session)):
    """Convenience endpoint: links sample PDFs generated in /samples to the enterprise checklist."""
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")

    sample_mappings = [
        {"app": "UDYAM_REG", "code": "PAN_CARD", "name": "Enterprise PAN Card", "file": "sahyadri_pan.pdf"},
        {"app": "GST_REG", "code": "PAN_CARD", "name": "Enterprise PAN Card", "file": "sahyadri_pan.pdf"},
        {"app": "PT_REG", "code": "MOA_PARTNERSHIP", "name": "Certificate of Incorporation", "file": "sahyadri_incorporation.pdf"},
        {"app": "BUILDING_PERMIT", "code": "LAND_ALLOTMENT", "name": "MIDC Allotment Letter", "file": "sahyadri_land_allotment.pdf"},
        {"app": "MPCB_CTE", "code": "LAND_DOCS", "name": "Land Possession Documents", "file": "sahyadri_land_allotment.pdf"},
    ]

    count = 0
    for m in sample_mappings:
        src = SAMPLES_DIR / m["file"]
        if src.exists():
            val_res = validate_document(
                file_path=str(src),
                doc_code=m["code"],
                profile_name=ent.name,
                profile_pan=ent.pan,
                profile_pin=ent.pin_code
            )
            extracted = val_res.get("extracted_fields", {})

            stmt = select(UploadedDocument).where(
                UploadedDocument.enterprise_id == enterprise_id,
                UploadedDocument.approval_id == m["app"],
                UploadedDocument.document_code == m["code"]
            )
            existing = session.exec(stmt).first()
            if not existing:
                doc = UploadedDocument(
                    enterprise_id=enterprise_id,
                    approval_id=m["app"],
                    document_code=m["code"],
                    document_name=m["name"],
                    filename=m["file"],
                    file_path=str(src),
                    file_size_bytes=os.path.getsize(src),
                    extracted_enterprise_name=extracted.get("enterprise_name"),
                    extracted_pan=extracted.get("pan"),
                    extracted_pin_code=extracted.get("pin_code"),
                    validation_status=val_res.get("status", "Pass"),
                    name_match_score=val_res.get("name_match_score", 100.0),
                    is_expired=False,
                    validation_issues_json=json.dumps(val_res.get("issues", [])),
                    readiness_score_contribution=val_res.get("readiness_contribution", 100.0),
                    is_vault_reused=True,
                    vault_consent_granted=True
                )
                session.add(doc)
                count += 1

    session.commit()
    return {"status": "success", "message": f"Attached {count} sample documents to enterprise {enterprise_id}"}
