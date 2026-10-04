import pytest
from datetime import datetime, timedelta, timezone
from backend.services.sla import (
    calculate_sla_due_date,
    compute_sla_metrics,
    pause_sla_clock,
    resume_sla_clock,
    set_demo_clock_offset,
    get_current_system_time
)

def test_01_sla_due_date_calculation():
    start = datetime(2026, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    due = calculate_sla_due_date(start, 30)
    assert due == start + timedelta(days=30)

def test_02_pause_and_resume_clock():
    set_demo_clock_offset(0)
    now = get_current_system_time()

    # Pause clock
    pause_res = pause_sla_clock(clock_paused=False, paused_at=None, total_paused_seconds=100)
    assert pause_res["clock_paused"] is True
    assert pause_res["paused_at"] is not None

    # Advance simulated time by 5 days
    set_demo_clock_offset(5)

    # Resume clock
    resume_res = resume_sla_clock(
        clock_paused=True,
        paused_at=pause_res["paused_at"],
        total_paused_seconds=pause_res["total_paused_seconds"]
    )
    assert resume_res["clock_paused"] is False
    assert resume_res["paused_at"] is None
    # 5 days in seconds ~ 432,000s + 100s
    assert resume_res["total_paused_seconds"] >= 400000

    set_demo_clock_offset(0) # Reset offset

def test_03_sla_metrics_at_risk_and_breach():
    set_demo_clock_offset(0)
    now = get_current_system_time()

    # Normal application with plenty of time
    submitted = now - timedelta(days=5)
    due = submitted + timedelta(days=30)
    metrics_normal = compute_sla_metrics(
        submitted_at=submitted,
        sla_due_date=due,
        sla_total_days=30,
        clock_paused=False,
        paused_at=None,
        total_paused_seconds=0,
        status="Submitted"
    )
    assert metrics_normal["days_remaining"] > 20
    assert not metrics_normal["is_breached"]
    assert not metrics_normal["is_at_risk"]

    # Application at risk (only 2 days left of 30 days -> < 25%)
    sub_risk = now - timedelta(days=28)
    due_risk = sub_risk + timedelta(days=30)
    metrics_risk = compute_sla_metrics(
        submitted_at=sub_risk,
        sla_due_date=due_risk,
        sla_total_days=30,
        clock_paused=False,
        paused_at=None,
        total_paused_seconds=0,
        status="Under Scrutiny"
    )
    assert metrics_risk["is_at_risk"] is True
    assert not metrics_risk["is_breached"]

    # Breached application (35 days elapsed of 30 days)
    sub_breach = now - timedelta(days=35)
    due_breach = sub_breach + timedelta(days=30)
    metrics_breach = compute_sla_metrics(
        submitted_at=sub_breach,
        sla_due_date=due_breach,
        sla_total_days=30,
        clock_paused=False,
        paused_at=None,
        total_paused_seconds=0,
        status="Under Scrutiny"
    )
    assert metrics_breach["is_breached"] is True
    assert metrics_breach["days_remaining"] < 0
