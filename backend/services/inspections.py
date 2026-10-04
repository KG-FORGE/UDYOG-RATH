import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select
from backend.models.inspection import JointInspection
from backend.models.application import Application

INSPECTION_DEPARTMENTS = ["MPCB", "FIRE", "DISH", "LABOUR", "LEGAL_METROLOGY"]

DEPARTMENT_LABELS = {
    "MPCB": "Maharashtra Pollution Control Board",
    "FIRE": "Maharashtra Fire Services",
    "DISH": "Directorate of Industrial Safety and Health",
    "LABOUR": "Labour Commissionerate",
    "LEGAL_METROLOGY": "Department of Legal Metrology"
}

def consolidate_inspections(
    session: Session,
    enterprise_id: int,
    location_address: str = "MIDC Industrial Area, Pune"
) -> JointInspection:
    """
    Finds or creates a joint inspection consolidating all eligible pending department inspections
    for an enterprise into a single proposed schedule.
    """
    stmt = select(JointInspection).where(JointInspection.enterprise_id == enterprise_id)
    existing = session.exec(stmt).first()
    if existing:
        return existing

    # Find pending applications across inspection-eligible departments
    app_stmt = select(Application).where(
        Application.enterprise_id == enterprise_id,
        Application.status.in_(["Submitted", "Under Scrutiny", "Inspection Scheduled"])
    )
    apps = session.exec(app_stmt).all()

    active_depts = list({app.department_code for app in apps if app.department_code in INSPECTION_DEPARTMENTS})
    if not active_depts:
        active_depts = ["MPCB", "FIRE", "DISH", "LABOUR"]

    visits_saved = max(1, len(active_depts) - 1)

    # Propose date 5 days from now
    proposed_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")

    initial_attendance = {dept: "Pending" for dept in active_depts}
    initial_findings = {dept: "Not yet inspected" for dept in active_depts}

    joint = JointInspection(
        enterprise_id=enterprise_id,
        lead_officer_name="Shri V. R. Kulkarni (Joint Inspection Lead Officer)",
        lead_department=active_depts[0] if active_depts else "MPCB",
        status="Proposed",
        scheduled_date=proposed_date,
        time_slot="10:30 AM - 01:30 PM",
        location_address=location_address,
        departments_json=json.dumps(active_depts),
        department_attendance_json=json.dumps(initial_attendance),
        department_findings_json=json.dumps(initial_findings),
        visits_saved=visits_saved,
        applicant_confirmation="Pending"
    )

    session.add(joint)
    session.commit()
    session.refresh(joint)
    return joint

def get_calendar_slots(month_year: str = "2026-10") -> List[Dict[str, Any]]:
    """Generates monthly inspection slot availability for administrative calendar table."""
    slots = []
    # 20 working days in the month
    for day in range(1, 29):
        date_str = f"{month_year}-{day:02d}"
        weekday = datetime.strptime(date_str, "%Y-%m-%d").weekday()
        if weekday < 5: # Monday to Friday
            status = "Available" if day % 3 != 0 else "Fully Booked"
            slots.append({
                "date": date_str,
                "day_name": ["Mon", "Tue", "Wed", "Thu", "Fri"][weekday],
                "morning_slot": "Available" if day % 2 == 0 else "Booked",
                "afternoon_slot": "Available" if day % 3 != 0 else "Booked",
                "status": status
            })
    return slots
