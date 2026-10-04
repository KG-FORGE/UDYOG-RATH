import os
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.database import get_session
from backend.models.application import Application, ApplicationEvent
from backend.models.enterprise import EnterpriseProfile
from backend.models.query import QueryTicket
from backend.models.document import UploadedDocument
from backend.models.user import User
from backend.models.notification import Notification
from backend.routers.auth import get_current_user
from backend.services.sla import compute_sla_metrics, calculate_sla_due_date, get_current_system_time
from backend.services.audit import append_audit_entry
from backend.services.rules_engine import rules_engine

router = APIRouter(prefix="/api/applications", tags=["Applications"])

class BatchSubmitRequest(BaseModel):
    enterprise_id: int
    approval_ids: List[str]
    has_documented_override: bool = False
    override_reason: Optional[str] = None

class OfficerActionRequest(BaseModel):
    action: str # "APPROVE", "REJECT", "FORWARD", "SCHEDULE_INSPECTION"
    remarks: str
    rejection_reason: Optional[str] = None
    scheduled_inspection_date: Optional[str] = None

def _generate_ref_no(session: Session) -> str:
    year = datetime.now(timezone.utc).year
    # Find max existing ref number
    count = session.exec(select(Application)).all()
    next_seq = len(count) + 101
    return f"MH-UR-{year}-{next_seq:06d}"

def _generate_certificate_pdf(app: Application, ent: EnterpriseProfile) -> Path:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors

    cert_dir = settings.DATA_DIR / "certificates"
    cert_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = cert_dir / f"cert_{app.ref_no}.pdf"

    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    width, height = letter

    # Outer ornate double borders
    c.setStrokeColor(colors.HexColor("#17375E"))
    c.setLineWidth(3)
    c.rect(30, 30, width - 60, height - 60)
    c.setLineWidth(1)
    c.rect(35, 35, width - 70, height - 70)

    # Tricolour header band
    c.setFillColor(colors.HexColor("#E8871E")) # Saffron
    c.rect(40, height - 50, (width - 80) / 3.0, 4, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#FFFFFF")) # White
    c.rect(40 + (width - 80) / 3.0, height - 50, (width - 80) / 3.0, 4, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#138808")) # Green
    c.rect(40 + 2 * (width - 80) / 3.0, height - 50, (width - 80) / 3.0, 4, fill=1, stroke=0)

    # Government Title
    c.setFillColor(colors.HexColor("#17375E"))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2.0, height - 80, "GOVERNMENT OF MAHARASHTRA")
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width / 2.0, height - 98, app.issuing_authority.upper())

    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor("#1F4E8C"))
    c.drawCentredString(width / 2.0, height - 130, f"STATUTORY CLEARANCE: {app.approval_name.upper()}")

    c.setStrokeColor(colors.HexColor("#E8871E"))
    c.setLineWidth(1.5)
    c.line(60, height - 145, width - 60, height - 145)

    # Certificate Details Box
    c.setFillColor(colors.HexColor("#1B1B1B"))
    c.setFont("Helvetica", 10)

    lines = [
        f"Unique Certificate Verification ID: {app.certificate_id or 'MH-CERT-2026-X01'}",
        f"Application Reference Number: {app.ref_no}",
        f"Name of Industrial Enterprise: {ent.name}",
        f"Constitution of Entity: {ent.constitution_type}",
        f"Permanent Account Number (PAN): {ent.pan}",
        f"Factory / Unit Location: {ent.registered_address}",
        f"Industrial Sector: {ent.sector.capitalize()} | District: {ent.district}",
        f"Capital Investment: INR {ent.investment_cr} Crore | Connected Load: {ent.power_kw} kW",
        f"Date of Sanction: {datetime.now(timezone.utc).strftime('%d %B %Y')}",
        f"Renewal Due Date: {(datetime.now(timezone.utc) + timedelta(days=365)).strftime('%d %B %Y')}",
        "",
        "This clearance is formally granted under the Maharashtra Industry, Trade and Investment Facilitation Act,",
        "having verified statutory compliance, technical schematics, and safety provisions.",
        "",
        "Competent Approving Authority: Joint Director / Regional Officer",
        "Digital Verification: Validated on UDYOGRATH Single Window Portal (Team KG-FORGE Prototype)"
    ]

    y = height - 180
    for line in lines:
        if line.startswith("Unique Certificate") or line.startswith("Application Reference"):
            c.setFont("Helvetica-Bold", 10)
            c.drawString(60, y, line)
            c.setFont("Helvetica", 10)
        else:
            c.drawString(60, y, line)
        y -= 20

    # Draw QR code placeholder box
    c.setStrokeColor(colors.HexColor("#17375E"))
    c.rect(width - 150, 60, 90, 90)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width - 105, 105, "[ QR VERIFY ]")
    c.setFont("Helvetica", 6)
    c.drawCentredString(width - 105, 75, app.ref_no)

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawString(60, 65, "Illustrative prototype certificate. Generated automatically by UDYOGRATH.")

    c.save()
    return pdf_path

@router.get("")
def list_applications(
    department_code: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    enterprise_id: Optional[int] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(Application)
    if department_code:
        query = query.where(Application.department_code == department_code)
    if status:
        query = query.where(Application.status == status)
    if risk_level:
        query = query.where(Application.risk_level == risk_level)
    if enterprise_id:
        query = query.where(Application.enterprise_id == enterprise_id)

    apps = session.exec(query.order_by(Application.submitted_at.desc())).all()

    result = []
    for a in apps:
        sla_info = compute_sla_metrics(
            submitted_at=a.submitted_at,
            sla_due_date=a.sla_due_date,
            sla_total_days=a.sla_total_days,
            clock_paused=a.clock_paused,
            paused_at=a.paused_at,
            total_paused_seconds=a.total_paused_seconds,
            status=a.status
        )

        ent = session.get(EnterpriseProfile, a.enterprise_id)
        result.append({
            "id": a.id,
            "ref_no": a.ref_no,
            "enterprise_id": a.enterprise_id,
            "enterprise_name": ent.name if ent else "Unknown Unit",
            "approval_id": a.approval_id,
            "approval_name": a.approval_name,
            "department_code": a.department_code,
            "issuing_authority": a.issuing_authority,
            "status": a.status,
            "risk_level": a.risk_level,
            "risk_score": a.risk_score,
            "sla_total_days": a.sla_total_days,
            "submitted_at": a.submitted_at.isoformat(),
            "sla_due_date": a.sla_due_date.isoformat(),
            "departmental_remarks": a.departmental_remarks,
            "certificate_id": a.certificate_id,
            "certificate_url": a.certificate_url,
            "sla_metrics": sla_info
        })

    return result

@router.get("/{id_or_ref}")
def get_application_detail(id_or_ref: str, session: Session = Depends(get_session)):
    if id_or_ref.isdigit():
        app = session.get(Application, int(id_or_ref))
    else:
        app = session.exec(select(Application).where(Application.ref_no == id_or_ref)).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    ent = session.get(EnterpriseProfile, app.enterprise_id)
    events = session.exec(select(ApplicationEvent).where(ApplicationEvent.application_id == app.id).order_by(ApplicationEvent.created_at.asc())).all()
    queries = session.exec(select(QueryTicket).where(QueryTicket.application_id == app.id)).all()
    docs = session.exec(select(UploadedDocument).where(UploadedDocument.enterprise_id == app.enterprise_id, UploadedDocument.approval_id == app.approval_id)).all()

    sla_info = compute_sla_metrics(
        submitted_at=app.submitted_at,
        sla_due_date=app.sla_due_date,
        sla_total_days=app.sla_total_days,
        clock_paused=app.clock_paused,
        paused_at=app.paused_at,
        total_paused_seconds=app.total_paused_seconds,
        status=app.status
    )

    return {
        "application": app,
        "enterprise": ent,
        "sla_metrics": sla_info,
        "events": events,
        "queries": queries,
        "documents": docs
    }

@router.get("/{id_or_ref}/certificate")
def download_certificate(id_or_ref: str, session: Session = Depends(get_session)):
    if id_or_ref.isdigit():
        app = session.get(Application, int(id_or_ref))
    else:
        app = session.exec(select(Application).where(Application.ref_no == id_or_ref)).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    ent = session.get(EnterpriseProfile, app.enterprise_id)
    pdf_path = _generate_certificate_pdf(app, ent)
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=f"Certificate_{app.ref_no}.pdf")

@router.post("/submit-batch")
def submit_batch_applications(req: BatchSubmitRequest, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, req.enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    ruleset = rules_engine.ruleset
    all_defs = {a["id"]: a for a in ruleset.get("approvals", [])}

    created_apps = []
    now = get_current_system_time()

    is_fast_track = ent.risk_category == "Fast Track"

    for app_id in req.approval_ids:
        # Check if already submitted
        existing = session.exec(select(Application).where(Application.enterprise_id == ent.id, Application.approval_id == app_id)).first()
        if existing:
            continue

        app_def = all_defs.get(app_id)
        if not app_def:
            continue

        sla_dict = app_def.get("sla_days", {"standard": 30, "fast_track": 15})
        sla_days = sla_dict.get("fast_track", 15) if is_fast_track else sla_dict.get("standard", 30)

        ref_no = _generate_ref_no(session)
        due_date = calculate_sla_due_date(now, sla_days)

        new_app = Application(
            ref_no=ref_no,
            enterprise_id=ent.id,
            approval_id=app_id,
            approval_name=app_def["name"],
            department_code=app_def.get("department_code", "GEN"),
            issuing_authority=app_def["authority"],
            status="Submitted",
            risk_level=ent.risk_category or "Standard",
            risk_score=ent.risk_score or 40.0,
            sla_total_days=sla_days,
            submitted_at=now,
            sla_due_date=due_date,
            departmental_remarks="Application dispatched via Combined Application Form. Statutory scrutiny initiated."
        )
        session.add(new_app)
        session.commit()
        session.refresh(new_app)

        # Initial event
        evt = ApplicationEvent(
            application_id=new_app.id,
            event_type="SUBMITTED",
            title="Application Dispatched",
            description=f"Statutory scrutiny clock started. Assigned SLA: {sla_days} days.",
            actor_name=ent.name,
            actor_role="APPLICANT",
            created_at=now
        )
        session.add(evt)
        session.commit()

        # Append audit log
        append_audit_entry(
            session=session,
            actor="applicant",
            role="APPLICANT",
            action="APPLICATION_DISPATCHED",
            resource_type="Application",
            resource_id=new_app.ref_no,
            details=f"Dispatched {new_app.approval_name} to {new_app.department_code}. SLA due: {due_date.strftime('%Y-%m-%d')}."
        )

        created_apps.append({
            "id": new_app.id,
            "ref_no": new_app.ref_no,
            "approval_name": new_app.approval_name,
            "department_code": new_app.department_code,
            "sla_days": sla_days,
            "sla_due_date": due_date.isoformat()
        })

    return {
        "status": "success",
        "message": f"Successfully submitted {len(created_apps)} statutory applications in parallel.",
        "applications": created_apps
    }

@router.post("/{id_or_ref}/action")
def officer_action(
    id_or_ref: str,
    req: OfficerActionRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    if id_or_ref.isdigit():
        app = session.get(Application, int(id_or_ref))
    else:
        app = session.exec(select(Application).where(Application.ref_no == id_or_ref)).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    ent = session.get(EnterpriseProfile, app.enterprise_id)
    officer_name = current_user.full_name if current_user else "Department Scrutiny Officer"
    now = get_current_system_time()

    if req.action == "APPROVE":
        app.status = "Approved"
        app.approved_at = now
        app.renewal_due_date = now + timedelta(days=365)
        app.certificate_id = f"{app.department_code}/CERT/2026/{random.randint(1000, 9999)}"
        app.certificate_url = f"/api/applications/{app.ref_no}/certificate"
        app.qr_code_data = f"UDYOGRATH-VERIFY:{app.ref_no}:APPROVED:{app.department_code}"
        app.departmental_remarks = req.remarks or "Statutory approval sanctioned following technical scrutiny."

        _generate_certificate_pdf(app, ent)

        evt = ApplicationEvent(
            application_id=app.id,
            event_type="APPROVED",
            title="Statutory Clearance Granted",
            description=f"Clearance granted by {officer_name}. Certificate ID: {app.certificate_id}.",
            actor_name=officer_name,
            actor_role="OFFICER",
            created_at=now
        )
        session.add(evt)

        # Notify applicant
        session.add(Notification(
            recipient_email="kunal.patil@sahyadri.in",
            recipient_name=ent.name,
            channel="IN_APP",
            title=f"Approval Granted: {app.approval_name}",
            message=f"Application {app.ref_no} has been approved. Certificate ID: {app.certificate_id}.",
            timestamp=now
        ))

    elif req.action == "REJECT":
        if not req.rejection_reason:
            raise HTTPException(status_code=400, detail="Mandatory rejection reason required")
        app.status = "Rejected"
        app.rejection_reason = req.rejection_reason
        app.departmental_remarks = req.remarks

        evt = ApplicationEvent(
            application_id=app.id,
            event_type="REJECTED",
            title="Application Rejected",
            description=f"Reason: {req.rejection_reason}",
            actor_name=officer_name,
            actor_role="OFFICER",
            created_at=now
        )
        session.add(evt)

    elif req.action == "FORWARD":
        app.status = "Under Scrutiny"
        app.departmental_remarks = req.remarks

        evt = ApplicationEvent(
            application_id=app.id,
            event_type="STATUS_CHANGE",
            title="Forwarded for Technical Appraisal",
            description=req.remarks or "Forwarded to specialized technical wing.",
            actor_name=officer_name,
            actor_role="OFFICER",
            created_at=now
        )
        session.add(evt)

    elif req.action == "SCHEDULE_INSPECTION":
        app.status = "Inspection Scheduled"
        app.departmental_remarks = req.remarks

        evt = ApplicationEvent(
            application_id=app.id,
            event_type="INSPECTION_SCHEDULED",
            title="Physical Inspection Scheduled",
            description=f"Scheduled on {req.scheduled_inspection_date or 'Next Joint Slot'}. Consolidated under Joint Inspection protocol.",
            actor_name=officer_name,
            actor_role="OFFICER",
            created_at=now
        )
        session.add(evt)

    session.add(app)
    session.commit()
    session.refresh(app)

    append_audit_entry(
        session=session,
        actor=officer_name,
        role="OFFICER",
        action=f"APPLICATION_{req.action}",
        resource_type="Application",
        resource_id=app.ref_no,
        details=f"Officer executed {req.action}. Status updated to {app.status}."
    )

    return {"status": "success", "new_status": app.status, "application": app}
