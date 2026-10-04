from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    sequence_no: int = Field(index=True, unique=True)
    timestamp: datetime = Field(default_factory=utc_now)

    actor: str # e.g. "kunal.patil@sahyadri.in" or "officer.mpcb"
    role: str # "APPLICANT", "OFFICER", "ADMIN", "SYSTEM"
    action: str # "APPLICATION_SUBMITTED", "QUERY_RAISED", "CLOCK_PAUSED", "CLOCK_RESUMED", "APPROVAL_GRANTED", "ESCALATION_TRIGGERED"
    resource_type: str # "Application", "Document", "QueryTicket", "JointInspection", "Grievance"
    resource_id: str
    details: str

    # SHA-256 Hash Chain
    previous_hash: str # Genesis record has "0" * 64
    record_hash: str # sha256(sequence_no + timestamp + actor + action + resource_type + resource_id + details + previous_hash)
