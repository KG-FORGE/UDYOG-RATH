from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class JointInspection(SQLModel, table=True):
    __tablename__ = "joint_inspections"

    id: Optional[int] = Field(default=None, primary_key=True)
    enterprise_id: int = Field(index=True, foreign_key="enterprises.id")
    lead_officer_name: str = "Lead Scrutiny Officer"
    lead_department: str = "MPCB"

    # Status: Proposed, Confirmed, Completed, Reschedule Requested
    status: str = "Proposed"
    scheduled_date: str # YYYY-MM-DD
    time_slot: str # "10:00 AM - 01:00 PM"
    location_address: str

    departments_json: str # '["MPCB", "FIRE", "DISH", "LABOUR", "LEGAL_METROLOGY"]'
    department_attendance_json: str = "{}" # '{"MPCB": "Attended", "FIRE": "Attended"}'
    department_findings_json: str = "{}" # '{"MPCB": "Compliant with ETP provisions"}'

    visits_saved: int = 4 # e.g. 5 departments consolidated into 1 joint visit = 4 visits saved
    applicant_confirmation: str = "Confirmed" # "Confirmed", "Pending", "Reschedule Requested"
    applicant_remarks: Optional[str] = None

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
