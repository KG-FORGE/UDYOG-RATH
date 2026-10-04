import pytest
from sqlmodel import Session, create_engine, SQLModel
from backend.models.audit import AuditLog
from backend.services.audit import append_audit_entry, verify_audit_chain

@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_01_hash_chain_integrity_verified(memory_db: Session):
    # Append multiple records
    append_audit_entry(memory_db, "user1", "APPLICANT", "SUBMIT", "App", "101", "Submitted app 101")
    append_audit_entry(memory_db, "officer1", "OFFICER", "QUERY", "App", "101", "Raised query on app 101")
    append_audit_entry(memory_db, "user1", "APPLICANT", "RESPOND", "App", "101", "Responded to query")

    is_valid, msg, broken_seq = verify_audit_chain(memory_db)
    assert is_valid is True
    assert "verified" in msg.lower()
    assert broken_seq is None

def test_02_tamper_detection_reports_failure(memory_db: Session):
    append_audit_entry(memory_db, "user1", "APPLICANT", "SUBMIT", "App", "201", "Initial submit")
    rec2 = append_audit_entry(memory_db, "officer1", "OFFICER", "APPROVE", "App", "201", "Approved app")
    append_audit_entry(memory_db, "admin", "ADMIN", "CLOSE", "App", "201", "Closed ticket")

    # Deliberately tamper with record 2 details without updating its hash
    rec2.details = "TAMPERED DETAILS: Fraudulent bypass of inspection"
    memory_db.add(rec2)
    memory_db.commit()

    is_valid, msg, broken_seq = verify_audit_chain(memory_db)
    assert is_valid is False
    assert broken_seq == rec2.sequence_no
    assert "tampering detected" in msg.lower() or "broken" in msg.lower()
