from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class SchemeApplication(SQLModel, table=True):
    __tablename__ = "scheme_applications"

    id: Optional[int] = Field(default=None, primary_key=True)
    enterprise_id: int = Field(index=True, foreign_key="enterprises.id")
    scheme_code: str = Field(index=True)
    scheme_name: str
    estimated_benefit_amount: str
    status: str = "Submitted" # "Submitted", "Under Verification", "Sanctioned", "Disbursed"
    application_date: datetime = Field(default_factory=utc_now)
    disbursement_notes: Optional[str] = None
