import hashlib
from datetime import datetime, timezone
from typing import Tuple, Optional
from sqlmodel import Session, select
from backend.models.audit import AuditLog
from backend.models.common import utc_now

GENESIS_HASH = "0" * 64

def calculate_hash(
    sequence_no: int,
    timestamp_iso: str,
    actor: str,
    role: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: str,
    previous_hash: str
) -> str:
    raw_payload = (
        f"{sequence_no}|{timestamp_iso}|{actor}|{role}|{action}|"
        f"{resource_type}|{resource_id}|{details}|{previous_hash}"
    )
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

def append_audit_entry(
    session: Session,
    actor: str,
    role: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: str,
    timestamp: Optional[datetime] = None
) -> AuditLog:
    """
    Appends an immutable audit log record linked to the previous record's SHA-256 hash.
    """
    dt = timestamp or utc_now()
    # Find latest record
    stmt = select(AuditLog).order_by(AuditLog.sequence_no.desc()).limit(1)
    latest = session.exec(stmt).first()

    if latest is None:
        sequence_no = 1
        previous_hash = GENESIS_HASH
    else:
        sequence_no = latest.sequence_no + 1
        previous_hash = latest.record_hash

    rec_hash = calculate_hash(
        sequence_no=sequence_no,
        timestamp_iso=dt.isoformat(),
        actor=actor,
        role=role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details,
        previous_hash=previous_hash
    )

    log_entry = AuditLog(
        sequence_no=sequence_no,
        timestamp=dt,
        actor=actor,
        role=role,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details,
        previous_hash=previous_hash,
        record_hash=rec_hash
    )

    session.add(log_entry)
    session.commit()
    session.refresh(log_entry)
    return log_entry

def verify_audit_chain(session: Session) -> Tuple[bool, str, Optional[int]]:
    """
    Verifies the cryptographic integrity of the entire audit chain.
    Returns (is_valid, report_message, first_broken_sequence_no).
    """
    stmt = select(AuditLog).order_by(AuditLog.sequence_no.asc())
    records = session.exec(stmt).all()

    if not records:
        return True, "Audit log is empty. Integrity verified.", None

    expected_prev_hash = GENESIS_HASH
    for rec in records:
        if rec.previous_hash != expected_prev_hash:
            return False, f"Broken link at sequence #{rec.sequence_no}: previous_hash does not match preceding record hash.", rec.sequence_no

        recomputed_hash = calculate_hash(
            sequence_no=rec.sequence_no,
            timestamp_iso=rec.timestamp.isoformat(),
            actor=rec.actor,
            role=rec.role,
            action=rec.action,
            resource_type=rec.resource_type,
            resource_id=rec.resource_id,
            details=rec.details,
            previous_hash=rec.previous_hash
        )

        if recomputed_hash != rec.record_hash:
            return False, f"Hash tampering detected at sequence #{rec.sequence_no}: stored hash differs from recomputed payload hash.", rec.sequence_no

        expected_prev_hash = rec.record_hash

    return True, f"Cryptographic integrity verified across {len(records)} audit records.", None
