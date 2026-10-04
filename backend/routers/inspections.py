import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime, timezone

from backend.app.database import get_session
from backend.models.inspection import JointInspection
from backend.models.enterprise import EnterpriseProfile
from backend.models.user import User
from backend.routers.auth import get_current_user
from backend.services.inspections import consolidate_inspections, get_calendar_slots
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/inspections", tags=["Common Inspection Planner"])

class ProposeSlotRequest(BaseModel):
    scheduled_date: str # YYYY-MM-DD
    time_slot: str # "10:30 AM - 01:30 PM"
    location_address: Optional[str] = None

class ConfirmationRequest(BaseModel):
    confirmation: str # "Confirmed" or "Reschedule Requested"
    remarks: Optional[str] = None

class AttendanceFindingsRequest(BaseModel):
    department_code: str
    attendance_status: str # "Attended", "Absent", "Exempt"
    finding_summary: str

@router.get("")
def list_inspections(enterprise_id: Optional[int] = None, session: Session = Depends(get_session)):
    query = select(JointInspection)
    if enterprise_id:
        query = query.where(JointInspection.enterprise_id == enterprise_id)
    items = session.exec(query.order_by(JointInspection.scheduled_date.asc())).all()

    result = []
    for it in items:
        ent = session.get(EnterpriseProfile, it.enterprise_id)
        result.append({
            "id": it.id,
            "enterprise_id": it.enterprise_id,
            "enterprise_name": ent.name if ent else "Unknown Unit",
            "lead_officer_name": it.lead_officer_name,
            "lead_department": it.lead_department,
            "status": it.status,
            "scheduled_date": it.scheduled_date,
            "time_slot": it.time_slot,
            "location_address": it.location_address,
            "departments": json.loads(it.departments_json),
            "department_attendance": json.loads(it.department_attendance_json),
            "department_findings": json.loads(it.department_findings_json),
            "visits_saved": it.visits_saved,
            "applicant_confirmation": it.applicant_confirmation,
            "applicant_remarks": it.applicant_remarks
        })
    return result

@router.get("/calendar")
def get_inspection_calendar():
    return get_calendar_slots("2026-10")

@router.post("/consolidate/{enterprise_id}")
def consolidate_for_enterprise(enterprise_id: int, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    joint = consolidate_inspections(session, enterprise_id, ent.registered_address or "MIDC Area, Pune")
    return {
        "status": "success",
        "joint_inspection_id": joint.id,
        "visits_saved": joint.visits_saved,
        "message": f"Consolidated {len(json.loads(joint.departments_json))} separate department inspections into 1 joint inspection schedule."
    }

@router.post("/{id}/propose-slot")
def propose_slot(id: int, req: ProposeSlotRequest, session: Session = Depends(get_session)):
    joint = session.get(JointInspection, id)
    if not joint:
        raise HTTPException(status_code=404, detail="Joint inspection not found")

    joint.scheduled_date = req.scheduled_date
    joint.time_slot = req.time_slot
    if req.location_address:
        joint.location_address = req.location_address
    joint.status = "Proposed"
    joint.applicant_confirmation = "Pending"
    session.add(joint)
    session.commit()

    append_audit_entry(
        session=session,
        actor="lead_officer",
        role="OFFICER",
        action="INSPECTION_SLOT_PROPOSED",
        resource_type="JointInspection",
        resource_id=str(joint.id),
        details=f"Joint inspection slot proposed for {joint.scheduled_date} at {joint.time_slot}."
    )

    return {"status": "success", "joint_inspection": joint}

@router.post("/{id}/confirm")
def applicant_confirm(id: int, req: ConfirmationRequest, session: Session = Depends(get_session)):
    joint = session.get(JointInspection, id)
    if not joint:
        raise HTTPException(status_code=404, detail="Joint inspection not found")

    joint.applicant_confirmation = req.confirmation
    joint.applicant_remarks = req.remarks
    if req.confirmation == "Confirmed":
        joint.status = "Confirmed"
    else:
        joint.status = "Reschedule Requested"

    session.add(joint)
    session.commit()

    append_audit_entry(
        session=session,
        actor="applicant",
        role="APPLICANT",
        action=f"INSPECTION_{req.confirmation.upper().replace(' ', '_')}",
        resource_type="JointInspection",
        resource_id=str(joint.id),
        details=f"Applicant marked inspection as {req.confirmation}. Remarks: {req.remarks or 'None'}."
    )

    return {"status": "success", "status_label": joint.status}

@router.post("/{id}/attendance-finding")
def record_attendance_finding(
    id: int,
    req: AttendanceFindingsRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    joint = session.get(JointInspection, id)
    if not joint:
        raise HTTPException(status_code=404, detail="Joint inspection not found")

    attendance = json.loads(joint.department_attendance_json)
    findings = json.loads(joint.department_findings_json)

    attendance[req.department_code] = req.attendance_status
    findings[req.department_code] = req.finding_summary

    joint.department_attendance_json = json.dumps(attendance)
    joint.department_findings_json = json.dumps(findings)

    # Check if all departments attended
    depts = json.loads(joint.departments_json)
    if all(attendance.get(d) in ["Attended", "Exempt"] for d in depts):
        joint.status = "Completed"

    session.add(joint)
    session.commit()

    officer_name = current_user.full_name if current_user else "Officer"
    append_audit_entry(
        session=session,
        actor=officer_name,
        role="OFFICER",
        action="INSPECTION_FINDINGS_LOGGED",
        resource_type="JointInspection",
        resource_id=str(joint.id),
        details=f"Logged attendance ({req.attendance_status}) & findings for {req.department_code}."
    )

    return {"status": "success", "attendance": attendance, "findings": findings, "inspection_status": joint.status}
