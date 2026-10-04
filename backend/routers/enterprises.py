from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime, timezone

from backend.app.database import get_session
from backend.models.enterprise import EnterpriseProfile
from backend.models.user import User
from backend.routers.auth import get_current_user
from backend.services.risk import compute_risk_profile
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/enterprises", tags=["Enterprises"])

class EnterpriseCreateRequest(BaseModel):
    # Step 1: Enterprise Details
    name: str
    constitution_type: str
    pan: str
    udyam_no: Optional[str] = None
    registered_address: Optional[str] = None
    pin_code: Optional[str] = None

    # Step 2: Project Details
    sector: str
    activity_description: str
    stage: str

    # Step 3: Scale and Location
    investment_cr: float
    employees: int
    power_kw: float
    water_kld: float
    district: str
    is_midc: bool = True
    midc_area_name: Optional[str] = None
    land_type: str = "Industrial Lease"

    # Step 4: Hazard Flags & Activity Indicators
    hazardous: bool = False
    effluent: bool = False
    boiler: bool = False
    explosives: bool = False
    storage_flammables: bool = False
    export_activity: bool = False

@router.get("", response_model=List[EnterpriseProfile])
def list_enterprises(session: Session = Depends(get_session)):
    return session.exec(select(EnterpriseProfile)).all()

@router.get("/{id}")
def get_enterprise(id: int, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    risk_info = compute_risk_profile({
        "sector": ent.sector,
        "investment_cr": ent.investment_cr,
        "employees": ent.employees,
        "power_kw": ent.power_kw,
        "hazardous": ent.hazardous,
        "effluent": ent.effluent,
        "boiler": ent.boiler,
        "storage_flammables": ent.storage_flammables,
        "is_midc": ent.is_midc
    })

    return {
        "enterprise": ent,
        "risk_profile": risk_info,
        "data_vault": {
            "pan": {"value": ent.pan, "verified": ent.pan_verified, "source": "Income Tax CBDT / MCA Gateway"},
            "udyam_no": {"value": ent.udyam_no, "verified": ent.udyam_verified, "source": "MoMSME Udyam National Portal"},
            "registered_address": {"value": ent.registered_address, "verified": ent.address_verified, "source": "MIDC Land Lease Record"},
            "pin_code": {"value": ent.pin_code, "verified": True, "source": "India Post Directory"},
            "land_type": {"value": ent.land_type, "verified": ent.land_verified, "source": "Mahabhulekh Zonal Registry"}
        }
    }

@router.post("", response_model=EnterpriseProfile)
def create_enterprise(
    req: EnterpriseCreateRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    # Compute deterministic risk classification
    risk_info = compute_risk_profile(req.model_dump())

    user_id = current_user.id if current_user else 1

    ent = EnterpriseProfile(
        user_id=user_id,
        name=req.name,
        constitution_type=req.constitution_type,
        pan=req.pan.upper(),
        udyam_no=req.udyam_no,
        registered_address=req.registered_address,
        pin_code=req.pin_code,
        sector=req.sector,
        activity_description=req.activity_description,
        stage=req.stage,
        investment_cr=req.investment_cr,
        employees=req.employees,
        power_kw=req.power_kw,
        water_kld=req.water_kld,
        district=req.district,
        is_midc=req.is_midc,
        midc_area_name=req.midc_area_name,
        land_type=req.land_type,
        hazardous=req.hazardous,
        effluent=req.effluent,
        boiler=req.boiler,
        explosives=req.explosives,
        storage_flammables=req.storage_flammables,
        export_activity=req.export_activity,
        risk_score=risk_info["risk_score"],
        risk_category=risk_info["risk_category"],
        pan_verified=True,
        udyam_verified=bool(req.udyam_no),
        land_verified=req.is_midc,
        address_verified=True
    )

    session.add(ent)
    session.commit()
    session.refresh(ent)

    # Append audit log
    actor_email = current_user.email if current_user else "applicant@demo.in"
    append_audit_entry(
        session=session,
        actor=actor_email,
        role="APPLICANT",
        action="ENTERPRISE_PROFILE_SAVED",
        resource_type="EnterpriseProfile",
        resource_id=str(ent.id),
        details=f"Enterprise '{ent.name}' created with risk category '{ent.risk_category}' (score: {ent.risk_score}). Verified Data Vault initialized."
    )

    return ent
