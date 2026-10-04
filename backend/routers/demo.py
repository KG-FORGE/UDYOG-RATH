from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.database import get_session
from backend.models.application import Application, ApplicationEvent
from backend.models.grievance import Grievance
from backend.models.notification import Notification
from backend.services.sla import (
    set_demo_clock_offset,
    get_demo_clock_offset,
    get_current_system_time,
    compute_sla_metrics
)
from backend.services.audit import append_audit_entry
from backend.scripts.seed_db import seed_database

router = APIRouter(prefix="/api/demo", tags=["Demo Controls & Clock"])

class AdvanceClockRequest(BaseModel):
    days: int # 1, 3, 7, 15

@router.get("/clock")
def get_demo_clock():
    offset = get_demo_clock_offset()
    current_simulated = get_current_system_time()
    return {
        "offset_days": offset,
        "simulated_datetime": current_simulated.isoformat(),
        "simulated_date_formatted": current_simulated.strftime("%d %B %Y, %I:%M %p UTC")
    }

@router.post("/clock/advance")
def advance_demo_clock(req: AdvanceClockRequest, session: Session = Depends(get_session)):
    current_offset = get_demo_clock_offset()
    new_offset = current_offset + req.days
    set_demo_clock_offset(new_offset)

    simulated_now = get_current_system_time()

    # Scan applications for SLA breaches & automatic right-to-services escalations
    apps = session.exec(select(Application).where(Application.status.not_in(["Approved", "Rejected"]))).all()

    new_breaches = 0
    escalations_triggered = 0

    for a in apps:
        sla_metrics = compute_sla_metrics(
            submitted_at=a.submitted_at,
            sla_due_date=a.sla_due_date,
            sla_total_days=a.sla_total_days,
            clock_paused=a.clock_paused,
            paused_at=a.paused_at,
            total_paused_seconds=a.total_paused_seconds,
            status=a.status
        )

        if sla_metrics["is_breached"]:
            new_breaches += 1
            days_overdue = abs(sla_metrics["days_remaining"])

            # Check if grievance exists
            g = session.exec(select(Grievance).where(Grievance.application_id == a.id)).first()
            if not g:
                ref = f"GR-2026-{a.id:04d}9"
                g = Grievance(
                    application_id=a.id,
                    enterprise_id=a.enterprise_id,
                    grievance_ref=ref,
                    escalation_level=1,
                    status="Active",
                    subject=f"Automated Escalation: Statutory SLA Breach on {a.approval_name}",
                    description=f"Statutory timeline ({a.sla_total_days} days) exceeded by {days_overdue:.1f} days without decision.",
                    level_1_notified_at=simulated_now
                )
                session.add(g)
                escalations_triggered += 1

                session.add(Notification(
                    recipient_email=f"nodal.{a.department_code.lower()}@gov.in",
                    recipient_name=f"{a.department_code} Department Nodal Officer",
                    channel="IN_APP",
                    title=f"SLA Breach Escalation: {a.ref_no}",
                    message=f"Application {a.ref_no} has breached statutory timeline by {days_overdue:.1f} days. Level 1 escalation active.",
                    timestamp=simulated_now
                ))

            # Trigger higher escalations based on overdue days
            if days_overdue >= 3.0 and g.escalation_level < 2:
                g.escalation_level = 2
                g.level_2_escalated_at = simulated_now
                escalations_triggered += 1
                session.add(Notification(
                    recipient_email="nodal.admin@maitri.gov.in",
                    recipient_name="MAITRI State Nodal Admin",
                    channel="EMAIL",
                    title=f"Level 2 Escalation (MAITRI): {a.ref_no}",
                    message=f"Department of {a.department_code} failed to resolve SLA breach after 3 days. Level 2 intervention required.",
                    timestamp=simulated_now
                ))

            if days_overdue >= 7.0 and g.escalation_level < 3:
                g.escalation_level = 3
                g.level_3_escalated_at = simulated_now
                escalations_triggered += 1
                session.add(Notification(
                    recipient_email="commissioner.rts@maha.gov.in",
                    recipient_name="Right to Services Chief Commissioner",
                    channel="SMS",
                    title="Level 3 Statutory Appellate Escalation",
                    message=f"[UDYOGRATH URGENT] App {a.ref_no} delayed by {days_overdue:.1f} days. Escalated to State Competent Authority.",
                    timestamp=simulated_now
                ))

            session.add(g)

    session.commit()

    append_audit_entry(
        session=session,
        actor="admin_demo",
        role="ADMIN",
        action="DEMO_CLOCK_ADVANCED",
        resource_type="DemoClock",
        resource_id=f"+{req.days}_DAYS",
        details=f"Demo clock advanced by {req.days} days. Total offset: {new_offset} days. SLA breaches checked ({new_breaches} found)."
    )

    return {
        "status": "success",
        "advanced_days": req.days,
        "total_offset_days": new_offset,
        "simulated_now": simulated_now.isoformat(),
        "breaches_detected": new_breaches,
        "escalations_triggered": escalations_triggered
    }

@router.post("/reset")
def reset_demo_state():
    set_demo_clock_offset(0)
    seed_database(force=True)
    return {"status": "success", "message": "Demo data and clock reset to fresh initial state."}

@router.get("/tour-scenario")
def get_tour_scenario():
    """Returns the 3-minute guided demo script steps for the walkthrough banner."""
    return {
        "title": "3-Minute Smart India Hackathon Live Demonstration Scenario",
        "team": "KG-FORGE (SIH26130)",
        "steps": [
            {
                "step_no": 1,
                "title": "Role: Entrepreneur (Applicant)",
                "description": "Log in as Entrepreneur. Open Enterprise Profile Wizard and view the 4-step wizard for Sahyadri Precision Components. Notice Verified Data Vault flags.",
                "route": "/wizard"
            },
            {
                "step_no": 2,
                "title": "Rules Engine: Know Your Approvals",
                "description": "View deterministic statutory checklist. Examine 'Why Required' rule explanations, Directed SVG Dependency Chart, and Parallel vs Sequential Timeline savings (54% time saved).",
                "route": "/approvals"
            },
            {
                "step_no": 3,
                "title": "Document Centre & Pre-Validation",
                "description": "Upload sample PDFs. Observe the deliberate name mismatch in 'sahyadri_mismatched_doc.pdf' detected by RapidFuzz (<85%), plain-language fix, and Readiness Score block (<80).",
                "route": "/documents"
            },
            {
                "step_no": 4,
                "title": "Multi-Department Dispatch & SLA Tracker",
                "description": "Submit batch application. Watch parallel statutory workflows initialize simultaneously across MPCB, FIRE, MIDC, DISH with reference numbers and SLA due dates.",
                "route": "/applications"
            },
            {
                "step_no": 5,
                "title": "Officer Workbench & Query Clock Pause",
                "description": "Switch to Department Officer (Fire). Open scrutiny workbench. Raise a technical query and see the statutory SLA clock pause. Switch to applicant, reply, and watch clock resume.",
                "route": "/workbench"
            },
            {
                "step_no": 6,
                "title": "Common Inspection Planner",
                "description": "Navigate to Joint Inspections. See 4 separate department visits consolidated into 1 synchronized joint inspection with calendar scheduling.",
                "route": "/inspections"
            },
            {
                "step_no": 7,
                "title": "Demo Clock Advance & Escalation Matrix",
                "description": "Click 'Advance Clock by 15 Days' in Demo Controls. Notice SLA breaches, automated SMS/email alerts, and Level 1 -> Level 2 -> Level 3 Right-to-Services escalations.",
                "route": "/grievance"
            },
            {
                "step_no": 8,
                "title": "MAITRI Admin Analytics & Audit Trail",
                "description": "Open MAITRI Admin dashboard. Inspect department delay heat tables, CSV export, and run cryptographic SHA-256 tamper-evident audit verification.",
                "route": "/analytics"
            },
            {
                "step_no": 9,
                "title": "Knowledge Centre Regulatory Assistant",
                "description": "Test regulatory assistant with valid question ('What is CTE requirement?') and off-topic question to demonstrate grounded citations and strict abstention with escalation button.",
                "route": "/assistant"
            }
        ]
    }
