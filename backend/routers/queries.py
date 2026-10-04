from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.database import get_session
from backend.models.query import QueryTicket
from backend.models.application import Application, ApplicationEvent
from backend.models.notification import Notification
from backend.models.user import User
from backend.routers.auth import get_current_user
from backend.services.sla import pause_sla_clock, resume_sla_clock, get_current_system_time
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/queries", tags=["Query Management"])

class RaiseQueryRequest(BaseModel):
    application_id: int
    category: str # "Missing Document", "Technical Clarification", "Fee Discrepancy", "Site Plan Defect", "Other"
    query_text: str

class RespondQueryRequest(BaseModel):
    response_text: str
    attachment_url: Optional[str] = None

@router.post("/raise")
def raise_query(
    req: RaiseQueryRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    app = session.get(Application, req.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    officer_name = current_user.full_name if current_user else "Department Scrutiny Officer"
    dept = app.department_code
    now = get_current_system_time()

    # 1. Create QueryTicket
    ticket = QueryTicket(
        application_id=app.id,
        officer_id=current_user.id if current_user else 2,
        officer_name=officer_name,
        department_code=dept,
        category=req.category,
        query_text=req.query_text,
        raised_at=now,
        is_resolved=False
    )
    session.add(ticket)

    # 2. Update Application status and PAUSE statutory SLA clock
    app.status = "Query Raised"
    pause_info = pause_sla_clock(
        clock_paused=app.clock_paused,
        paused_at=app.paused_at,
        total_paused_seconds=app.total_paused_seconds
    )
    app.clock_paused = pause_info["clock_paused"]
    app.paused_at = pause_info["paused_at"]

    # 3. Add Application Events
    evt1 = ApplicationEvent(
        application_id=app.id,
        event_type="QUERY_RAISED",
        title=f"Statutory Query Raised: {req.category}",
        description=req.query_text,
        actor_name=officer_name,
        actor_role="OFFICER",
        created_at=now
    )
    evt2 = ApplicationEvent(
        application_id=app.id,
        event_type="CLOCK_PAUSED",
        title="Statutory SLA Clock Paused",
        description="Clock paused in accordance with Maharashtra Facilitation Act pending applicant response.",
        actor_name="System Orchestrator",
        actor_role="SYSTEM",
        created_at=now
    )
    session.add(evt1)
    session.add(evt2)

    # 4. Trigger In-App & SMS notification
    session.add(Notification(
        recipient_email="kunal.patil@sahyadri.in",
        recipient_phone="+91-98220-11223",
        recipient_name="Applicant",
        channel="IN_APP",
        title=f"Clarification Required: {app.approval_name}",
        message=f"Query raised on {app.ref_no}: '{req.query_text[:100]}...'. Statutory clock paused.",
        timestamp=now
    ))
    session.add(Notification(
        recipient_email="kunal.patil@sahyadri.in",
        recipient_phone="+91-98220-11223",
        recipient_name="Applicant",
        channel="SMS",
        title="Query Notice",
        message=f"[UDYOGRATH] Dept of {dept} raised a query on {app.ref_no}. SLA clock paused. Please log in to respond.",
        timestamp=now
    ))

    session.add(app)
    session.commit()
    session.refresh(ticket)

    # 5. Append Audit Entry
    append_audit_entry(
        session=session,
        actor=officer_name,
        role="OFFICER",
        action="QUERY_RAISED_CLOCK_PAUSED",
        resource_type="QueryTicket",
        resource_id=str(ticket.id),
        details=f"Query raised on {app.ref_no} ({req.category}). SLA clock paused."
    )

    return {
        "status": "success",
        "ticket": {
            "id": ticket.id,
            "application_id": ticket.application_id,
            "officer_name": ticket.officer_name,
            "category": ticket.category,
            "query_text": ticket.query_text,
            "is_resolved": ticket.is_resolved
        },
        "clock_paused": True
    }

@router.post("/{id}/respond")
def respond_query(
    id: int,
    req: RespondQueryRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    ticket = session.get(QueryTicket, id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Query ticket not found")

    app = session.get(Application, ticket.application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    applicant_name = current_user.full_name if current_user else "Applicant"
    now = get_current_system_time()

    # 1. Update ticket
    ticket.is_resolved = True
    ticket.response_text = req.response_text
    ticket.response_attachment_url = req.attachment_url
    ticket.responded_at = now
    session.add(ticket)

    # 2. RESUME statutory SLA clock and set status back to Under Scrutiny
    resume_info = resume_sla_clock(
        clock_paused=app.clock_paused,
        paused_at=app.paused_at,
        total_paused_seconds=app.total_paused_seconds
    )
    app.clock_paused = resume_info["clock_paused"]
    app.paused_at = resume_info["paused_at"]
    app.total_paused_seconds = resume_info["total_paused_seconds"]
    app.status = "Under Scrutiny"
    session.add(app)

    # 3. Add Application Events
    evt1 = ApplicationEvent(
        application_id=app.id,
        event_type="QUERY_RESPONDED",
        title="Query Response Submitted",
        description=req.response_text,
        actor_name=applicant_name,
        actor_role="APPLICANT",
        created_at=now
    )
    evt2 = ApplicationEvent(
        application_id=app.id,
        event_type="CLOCK_RESUMED",
        title="Statutory SLA Clock Resumed",
        description=f"Clock resumed. Total paused time recorded: {round(app.total_paused_seconds / 86400.0, 1)} days.",
        actor_name="System Orchestrator",
        actor_role="SYSTEM",
        created_at=now
    )
    session.add(evt1)
    session.add(evt2)

    # 4. Notify officer
    session.add(Notification(
        recipient_email=f"officer.{app.department_code.lower()}@gov.in",
        recipient_name="Scrutiny Officer",
        channel="IN_APP",
        title=f"Query Response Received: {app.ref_no}",
        message=f"Applicant submitted clarification for {app.approval_name}. Scrutiny clock resumed.",
        timestamp=now
    ))

    session.commit()

    # 5. Append Audit Entry
    append_audit_entry(
        session=session,
        actor=applicant_name,
        role="APPLICANT",
        action="QUERY_RESPONDED_CLOCK_RESUMED",
        resource_type="QueryTicket",
        resource_id=str(ticket.id),
        details=f"Applicant responded to query on {app.ref_no}. SLA clock resumed."
    )

    return {"status": "success", "clock_resumed": True, "application_status": app.status}
