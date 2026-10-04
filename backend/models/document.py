from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class UploadedDocument(SQLModel, table=True):
    __tablename__ = "documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    enterprise_id: int = Field(index=True)
    approval_id: str = Field(index=True)
    document_code: str = Field(index=True) # e.g. "PAN_CARD", "DPR_PROCESS"
    document_name: str
    filename: str
    file_path: str
    file_size_bytes: int
    mime_type: str = "application/pdf"

    # Extracted metadata & checks
    extracted_text_preview: Optional[str] = None
    extracted_enterprise_name: Optional[str] = None
    extracted_pan: Optional[str] = None
    extracted_pin_code: Optional[str] = None
    extracted_expiry_date: Optional[str] = None

    # Validator outputs
    validation_status: str = "Pass" # "Pass", "Warning", "Fail"
    name_match_score: float = 100.0 # 0 to 100 via rapidfuzz
    is_expired: bool = False
    validation_issues_json: str = "[]" # JSON list of strings/fixes
    readiness_score_contribution: float = 100.0

    # Verified Data Vault link
    is_vault_reused: bool = False
    vault_consent_granted: bool = False

    created_at: datetime = Field(default_factory=utc_now)
