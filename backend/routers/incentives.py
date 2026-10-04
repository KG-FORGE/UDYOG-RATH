from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.database import get_session
from backend.models.incentive import SchemeApplication
from backend.models.enterprise import EnterpriseProfile
from backend.services.incentives import match_schemes_for_profile, ILLUSTRATIVE_SCHEMES
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/incentives", tags=["Incentive & Scheme Matcher"])

class ApplySchemeRequest(BaseModel):
    enterprise_id: int
    scheme_code: str

@router.get("/all-schemes")
def get_all_schemes():
    return [
        {
            "code": s["code"],
            "name": s["name"],
            "authority": s["authority"],
            "category": s["category"],
            "benefit_label": s["benefit_label"],
            "eligibility_reasons": s["eligibility_reasons"],
            "documents": s["documents"]
        }
        for s in ILLUSTRATIVE_SCHEMES
    ]

@router.get("/eligible/{enterprise_id}")
def get_eligible_schemes_for_enterprise(enterprise_id: int, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")

    profile_dict = {
        "sector": ent.sector, "stage": ent.stage, "investment_cr": ent.investment_cr,
        "employees": ent.employees, "power_kw": ent.power_kw, "water_kld": ent.water_kld,
        "district": ent.district, "is_midc": ent.is_midc, "hazardous": ent.hazardous,
        "effluent": ent.effluent, "boiler": ent.boiler, "storage_flammables": ent.storage_flammables,
        "export_activity": ent.export_activity
    }

    matched = match_schemes_for_profile(profile_dict)

    # Check which schemes have already been applied for
    apps = session.exec(select(SchemeApplication).where(SchemeApplication.enterprise_id == enterprise_id)).all()
    applied_codes = {a.scheme_code: a for a in apps}

    result = []
    for m in matched:
        existing = applied_codes.get(m["code"])
        result.append({
            **m,
            "has_applied": existing is not None,
            "application_id": existing.id if existing else None,
            "application_status": existing.status if existing else None
        })

    return {
        "enterprise_id": enterprise_id,
        "enterprise_name": ent.name,
        "total_eligible": len(result),
        "schemes": result
    }

@router.post("/apply")
def apply_for_scheme(req: ApplySchemeRequest, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, req.enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise not found")

    scheme = next((s for s in ILLUSTRATIVE_SCHEMES if s["code"] == req.scheme_code), None)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    existing = session.exec(select(SchemeApplication).where(
        SchemeApplication.enterprise_id == req.enterprise_id,
        SchemeApplication.scheme_code == req.scheme_code
    )).first()

    if existing:
        return {"status": "already_applied", "application": existing}

    profile_dict = {
        "sector": ent.sector, "stage": ent.stage, "investment_cr": ent.investment_cr,
        "employees": ent.employees, "power_kw": ent.power_kw, "water_kld": ent.water_kld,
        "district": ent.district, "is_midc": ent.is_midc, "hazardous": ent.hazardous,
        "effluent": ent.effluent, "boiler": ent.boiler, "storage_flammables": ent.storage_flammables,
        "export_activity": ent.export_activity
    }
    benefit = scheme["estimated_benefit_formula"](profile_dict)

    app = SchemeApplication(
        enterprise_id=req.enterprise_id,
        scheme_code=req.scheme_code,
        scheme_name=scheme["name"],
        estimated_benefit_amount=benefit,
        status="Submitted",
        disbursement_notes="Application submitted via UDYOGRATH Single Window. Under scrutiny by Directorate of Industries."
    )
    session.add(app)
    session.commit()
    session.refresh(app)

    append_audit_entry(
        session=session,
        actor="applicant",
        role="APPLICANT",
        action="INCENTIVE_APPLICATION_SUBMITTED",
        resource_type="SchemeApplication",
        resource_id=str(app.id),
        details=f"Applied for {scheme['name']} (Estimated: {benefit})."
    )

    return {"status": "success", "application": app}

@router.get("/my-applications/{enterprise_id}")
def get_enterprise_scheme_applications(enterprise_id: int, session: Session = Depends(get_session)):
    apps = session.exec(select(SchemeApplication).where(SchemeApplication.enterprise_id == enterprise_id)).all()
    return apps
