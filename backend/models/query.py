from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class QueryTicket(SQLModel, table=True):
    __tablename__ = "query_tickets"

    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(index=True, foreign_key="applications.id")
    officer_id: int
    officer_name: str
    department_code: str

    category: str # "Missing Document", "Technical Clarification", "Fee Discrepancy", "Site Plan Defect", "Other"
    query_text: str
    raised_at: datetime = Field(default_factory=utc_now)

    # Response fields
    is_resolved: bool = False
    response_text: Optional[str] = None
    response_attachment_url: Optional[str] = None
    responded_at: Optional[datetime] = None
