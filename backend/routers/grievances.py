import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.database import get_session
from backend.models.grievance import Grievance
from backend.models.application import Application
from backend.models.enterprise import EnterpriseProfile
from backend.models.notification import Notification
from backend.services.sla import get_current_system_time
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/grievances", tags=["Grievance & Escalation"])

class RaiseGrievanceRequest(BaseModel):
    application_id: int
    enterprise_id: int
    subject: str
    description: str

class OfficerGrievanceActionRequest(BaseModel):
    action: str # "RESOLVE", "RESPOND", "DISMISS"
    response_text: str
    action_taken: Optional[str] = None

@router.get("")
def list_grievances(enterprise_id: Optional[int] = None, session: Session = Depends(get_session)):
    query = select(Grievance)
    if enterprise_id:
        query = query.where(Grievance.enterprise_id == enterprise_id)
    grievances = session.exec(query.order_by(Grievance.created_at.desc())).all()

    result = []
    for g in grievances:
        app = session.get(Application, g.application_id)
        ent = session.get(EnterpriseProfile, g.enterprise_id)
        result.append({
            "id": g.id,
            "grievance_ref": g.grievance_ref,
            "application_id": g.application_id,
            "application_ref": app.ref_no if app else "Unknown",
            "department_code": app.department_code if app else "GEN",
            "approval_name": app.approval_name if app else "Unknown Clearance",
            "enterprise_id": g.enterprise_id,
            "enterprise_name": ent.name if ent else "Unknown Enterprise",
            "escalation_level": g.escalation_level,
            "status": g.status,
            "subject": g.subject,
            "description": g.description,
            "level_1_notified_at": g.level_1_notified_at.isoformat() if g.level_1_notified_at else None,
            "level_2_escalated_at": g.level_2_escalated_at.isoformat() if g.level_2_escalated_at else None,
            "level_3_escalated_at": g.level_3_escalated_at.isoformat() if g.level_3_escalated_at else None,
            "officer_response": g.officer_response,
            "action_taken": g.action_taken,
            "created_at": g.created_at.isoformat()
        })
    return result

@router.post("/raise")
def raise_grievance(req: RaiseGrievanceRequest, session: Session = Depends(get_session)):
    app = session.get(Application, req.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    ent = session.get(EnterpriseProfile, req.enterprise_id)
    now = get_current_system_time()
    ref_no = f"GR-2026-{random.randint(10000, 99999)}"

    grievance = Grievance(
        application_id=app.id,
        enterprise_id=req.enterprise_id,
        grievance_ref=ref_no,
        escalation_level=1,
        status="Active",
        subject=req.subject,
        description=req.description,
        level_1_notified_at=now,
        created_at=now
    )
    session.add(grievance)

    # Notify Level 1 Department Nodal Officer
    session.add(Notification(
        recipient_email=f"nodal.{app.department_code.lower()}@gov.in",
        recipient_name=f"{app.department_code} Nodal Officer",
        channel="IN_APP",
        title=f"Grievance Filed: {ref_no}",
        message=f"Grievance filed against {app.ref_no} ({app.approval_name}). Level 1 statutory review initiated.",
        timestamp=now
    ))

    session.commit()
    session.refresh(grievance)

    append_audit_entry(
        session=session,
        actor="applicant",
        role="APPLICANT",
        action="GRIEVANCE_FILED_LEVEL_1",
        resource_type="Grievance",
        resource_id=ref_no,
        details=f"Filed RTS Grievance against {app.ref_no}. Assigned to Level 1 Department Nodal Officer."
    )

    return {"status": "success", "grievance_ref": ref_no, "grievance": grievance}

@router.post("/{id}/action")
def officer_grievance_action(id: int, req: OfficerGrievanceActionRequest, session: Session = Depends(get_session)):
    g = session.get(Grievance, id)
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")

    now = get_current_system_time()
    g.officer_response = req.response_text
    g.action_taken = req.action_taken

    if req.action == "RESOLVE":
        g.status = "Resolved"
        g.resolved_at = now
    elif req.action == "DISMISS":
        g.status = "Dismissed"

    session.add(g)
    session.commit()

    append_audit_entry(
        session=session,
        actor="officer_nodal",
        role="OFFICER",
        action=f"GRIEVANCE_{req.action}",
        resource_type="Grievance",
        resource_id=g.grievance_ref,
        details=f"Grievance marked {g.status}. Response: {req.response_text[:80]}"
    )

    return {"status": "success", "grievance": g}
