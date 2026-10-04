from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class Grievance(SQLModel, table=True):
    __tablename__ = "grievances"

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(index=True, foreign_key="applications.id")
    enterprise_id: int = Field(index=True, foreign_key="enterprises.id")
    grievance_ref: str = Field(index=True, unique=True) # e.g. GR-2026-00042

    escalation_level: int = 1 # 1: Department Nodal Officer, 2: MAITRI Nodal Admin, 3: Competent Authority / Appellate
    status: str = "Active" # "Active", "Under Review", "Resolved", "Dismissed"
    subject: str
    description: str

    # Escalation trail
    level_1_notified_at: Optional[datetime] = None
    level_2_escalated_at: Optional[datetime] = None
    level_3_escalated_at: Optional[datetime] = None

    officer_response: Optional[str] = None
    action_taken: Optional[str] = None
    resolved_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
