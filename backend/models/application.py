from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class Application(SQLModel, table=True):
    __tablename__ = "applications"

    id: Optional[int] = Field(default=None, primary_key=True)
    ref_no: str = Field(index=True, unique=True) # e.g. MH-UR-2026-000101
    enterprise_id: int = Field(index=True, foreign_key="enterprises.id")
    approval_id: str = Field(index=True) # e.g. "MPCB_CTE"
    approval_name: str
    department_code: str = Field(index=True) # e.g. "MPCB", "FIRE", "DISH", "MIDC"
    issuing_authority: str

    status: str = "Submitted" # Draft, Submitted, Under Scrutiny, Query Raised, Inspection Scheduled, Approved, Rejected, Renewal Due
    rejection_reason: Optional[str] = None
    departmental_remarks: Optional[str] = None

    # Risk classification
    risk_level: str = "Standard" # "Fast Track", "Standard", "Detailed Scrutiny"
    risk_score: float = 40.0

    # Statutory Timelines & SLA Clock
    sla_total_days: int = 30
    submitted_at: datetime = Field(default_factory=utc_now)
    sla_due_date: datetime
    clock_paused: bool = False
    paused_at: Optional[datetime] = None
    total_paused_seconds: int = 0
    approved_at: Optional[datetime] = None
    renewal_due_date: Optional[datetime] = None

    # Certificate details
    certificate_id: Optional[str] = None
    certificate_url: Optional[str] = None
    qr_code_data: Optional[str] = None

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ApplicationEvent(SQLModel, table=True):
    __tablename__ = "application_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(index=True, foreign_key="applications.id")
    event_type: str # "SUBMITTED", "STATUS_CHANGE", "QUERY_RAISED", "QUERY_RESPONDED", "CLOCK_PAUSED", "CLOCK_RESUMED", "INSPECTION_SCHEDULED", "APPROVED", "REJECTED"
    title: str
    description: str
    actor_name: str
    actor_role: str
    created_at: datetime = Field(default_factory=utc_now)
