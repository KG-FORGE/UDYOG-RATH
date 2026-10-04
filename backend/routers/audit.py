from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from backend.app.database import get_session
from backend.models.audit import AuditLog
from backend.services.audit import verify_audit_chain

router = APIRouter(prefix="/api/audit", tags=["Cryptographic Audit Trail"])

@router.get("/logs")
def list_audit_logs(limit: int = 50, session: Session = Depends(get_session)):
    stmt = select(AuditLog).order_by(AuditLog.sequence_no.desc()).limit(limit)
    records = session.exec(stmt).all()
    return records

@router.get("/verify")
def verify_audit_trail_integrity(session: Session = Depends(get_session)):
    is_valid, msg, broken_seq = verify_audit_chain(session)
    count = len(session.exec(select(AuditLog)).all())
    return {
        "is_valid": is_valid,
        "message": msg,
        "broken_sequence_no": broken_seq,
        "total_records_checked": count,
        "hash_algorithm": "SHA-256 (Immutable Chain)"
    }
