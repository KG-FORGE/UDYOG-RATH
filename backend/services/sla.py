from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

# In-memory offset in days for the Demo Clock (persisted across requests)
DEMO_CLOCK_OFFSET_DAYS = 0

def get_current_system_time() -> datetime:
    """Returns current simulated time, taking Demo Clock advance into account."""
    return datetime.now(timezone.utc) + timedelta(days=DEMO_CLOCK_OFFSET_DAYS)

def set_demo_clock_offset(days: int):
    global DEMO_CLOCK_OFFSET_DAYS
    DEMO_CLOCK_OFFSET_DAYS = days

def get_demo_clock_offset() -> int:
    return DEMO_CLOCK_OFFSET_DAYS

def calculate_sla_due_date(submitted_at: datetime, sla_days: int) -> datetime:
    """Calculates initial statutory SLA due date based on working calendar/days."""
    return submitted_at + timedelta(days=sla_days)

def compute_sla_metrics(
    submitted_at: datetime,
    sla_due_date: datetime,
    sla_total_days: int,
    clock_paused: bool,
    paused_at: Optional[datetime],
    total_paused_seconds: int,
    status: str
) -> Dict[str, Any]:
    """
    Computes real-time statutory SLA status, days remaining, at-risk flag, and breach flag.
    If clock is paused, the elapsed time does not count towards SLA consumption.
    """
    now = get_current_system_time()

    # Active paused duration if currently paused
    current_paused_delta = 0
    if clock_paused and paused_at:
        current_paused_delta = max(0, int((now - paused_at).total_seconds()))

    effective_total_paused_sec = total_paused_seconds + current_paused_delta

    # Effective due date shifts outward by total paused duration
    adjusted_due_date = sla_due_date + timedelta(seconds=effective_total_paused_sec)

    # If already approved or rejected, clock stops
    if status in ["Approved", "Rejected"]:
        seconds_remaining = 0
        days_remaining = 0
        is_breached = False
        is_at_risk = False
        consumed_percentage = 100.0
    else:
        diff = adjusted_due_date - now
        seconds_remaining = int(diff.total_seconds())
        # Convert seconds to fractional days
        days_remaining = round(seconds_remaining / 86400.0, 1)

        is_breached = seconds_remaining < 0
        # Less than 25% of SLA time remaining triggers warning/at-risk status
        risk_threshold_days = 0.25 * float(sla_total_days)
        is_at_risk = (days_remaining <= risk_threshold_days) and not is_breached

        # Percentage of SLA consumed
        total_seconds = sla_total_days * 86400.0
        elapsed_seconds = max(0.0, total_seconds - seconds_remaining)
        consumed_percentage = min(100.0, max(0.0, round((elapsed_seconds / total_seconds) * 100.0, 1)))

    return {
        "days_remaining": days_remaining,
        "is_breached": is_breached,
        "is_at_risk": is_at_risk,
        "clock_paused": clock_paused,
        "adjusted_due_date": adjusted_due_date.isoformat(),
        "consumed_percentage": consumed_percentage,
        "effective_paused_days": round(effective_total_paused_sec / 86400.0, 1)
    }

def pause_sla_clock(
    clock_paused: bool,
    paused_at: Optional[datetime],
    total_paused_seconds: int
) -> Dict[str, Any]:
    """Pauses the statutory clock when a departmental query is raised."""
    if clock_paused:
        return {
            "clock_paused": True,
            "paused_at": paused_at,
            "total_paused_seconds": total_paused_seconds
        }
    return {
        "clock_paused": True,
        "paused_at": get_current_system_time(),
        "total_paused_seconds": total_paused_seconds
    }

def resume_sla_clock(
    clock_paused: bool,
    paused_at: Optional[datetime],
    total_paused_seconds: int
) -> Dict[str, Any]:
    """Resumes statutory clock when applicant submits query response."""
    if not clock_paused or not paused_at:
        return {
            "clock_paused": False,
            "paused_at": None,
            "total_paused_seconds": total_paused_seconds
        }
    now = get_current_system_time()
    additional_sec = max(0, int((now - paused_at).total_seconds()))
    return {
        "clock_paused": False,
        "paused_at": None,
        "total_paused_seconds": total_paused_seconds + additional_sec
    }
