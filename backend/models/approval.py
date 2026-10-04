from typing import List, Optional
from pydantic import BaseModel

class DocumentRequirement(BaseModel):
    code: str
    name: str
    mandatory: bool = True
    validators: List[str] = []
    accepted_formats: List[str] = ["pdf", "jpg", "png"]

class ApprovalItem(BaseModel):
    id: str
    name: str
    authority: str
    department_code: str
    legal_basis_label: str
    why_required: str
    prerequisites: List[str] = []
    parallel_group: str
    sla_days: int
    sla_standard: int
    sla_fast_track: int
    fee_label: str
    documents: List[DocumentRequirement] = []
    applied: bool = False
    application_id: Optional[int] = None
    application_ref: Optional[str] = None
    application_status: Optional[str] = None
