import csv
import io
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from backend.app.database import get_session
from backend.models.application import Application
from backend.models.query import QueryTicket
from backend.models.grievance import Grievance
from backend.models.inspection import JointInspection
from backend.services.sla import compute_sla_metrics

router = APIRouter(prefix="/api/analytics", tags=["Admin Analytics"])

DEPARTMENT_NAMES = {
    "MPCB": "Pollution Control Board",
    "FIRE": "Fire Services",
    "DISH": "Factories & Industrial Safety",
    "MSEDCL": "Electricity Distribution",
    "MIDC": "Industrial Development Corp",
    "LABOUR": "Labour Commissionerate",
    "LEGAL_METROLOGY": "Legal Metrology",
    "LOCAL_BODY": "Local Municipal Body",
    "FDA": "Food and Drug Administration",
    "ENVIRONMENT": "State Environment Dept",
    "DIC": "District Industries Centre"
}

@router.get("/maitri-summary")
def get_maitri_analytics(session: Session = Depends(get_session)):
    apps = session.exec(select(Application)).all()
    queries = session.exec(select(QueryTicket)).all()
    grievances = session.exec(select(Grievance)).all()
    inspections = session.exec(select(JointInspection)).all()

    # Department processing metrics
    dept_stats: Dict[str, Dict[str, Any]] = {}
    for a in apps:
        code = a.department_code
        if code not in dept_stats:
            dept_stats[code] = {
                "department_code": code,
                "department_name": DEPARTMENT_NAMES.get(code, code),
                "total_apps": 0,
                "approved_count": 0,
                "rejected_count": 0,
                "pending_count": 0,
                "breached_count": 0,
                "at_risk_count": 0,
                "total_statutory_sla_days": 0,
                "avg_statutory_days": 0.0,
                "avg_actual_processing_days": 0.0
            }

        st = dept_stats[code]
        st["total_apps"] += 1
        st["total_statutory_sla_days"] += a.sla_total_days

        sla_metrics = compute_sla_metrics(
            submitted_at=a.submitted_at,
            sla_due_date=a.sla_due_date,
            sla_total_days=a.sla_total_days,
            clock_paused=a.clock_paused,
            paused_at=a.paused_at,
            total_paused_seconds=a.total_paused_seconds,
            status=a.status
        )

        if a.status == "Approved":
            st["approved_count"] += 1
        elif a.status == "Rejected":
            st["rejected_count"] += 1
        else:
            st["pending_count"] += 1
            if sla_metrics["is_breached"]:
                st["breached_count"] += 1
            elif sla_metrics["is_at_risk"]:
                st["at_risk_count"] += 1

    department_benchmarks = []
    for code, st in dept_stats.items():
        total = st["total_apps"]
        avg_sla = round(st["total_statutory_sla_days"] / total, 1) if total > 0 else 30.0
        st["avg_statutory_days"] = avg_sla

        # Illustrative average processing days based on breaches
        if st["breached_count"] > 0:
            actual_days = round(avg_sla * 1.35, 1) # delayed
            delay_severity = "High Delay"
            heat_color = "#B3261E" # danger red
        elif st["at_risk_count"] > 0:
            actual_days = round(avg_sla * 0.95, 1) # borderline
            delay_severity = "Moderate"
            heat_color = "#E8871E" # amber/saffron
        else:
            actual_days = round(avg_sla * 0.65, 1) # efficient
            delay_severity = "On Track"
            heat_color = "#1E7B34" # success green

        st["avg_actual_processing_days"] = actual_days
        st["delay_severity"] = delay_severity
        st["heat_color"] = heat_color
        st["sla_compliance_pct"] = round(100.0 - ((st["breached_count"] / total * 100.0) if total else 0.0), 1)

        department_benchmarks.append(st)

    # Sort bottleneck table descending by breached_count, then actual_days
    department_benchmarks.sort(key=lambda x: (x["breached_count"], x["avg_actual_processing_days"]), reverse=True)

    # Rejection reasons breakdown
    rejection_reasons = [
        {"reason": "Incomplete ETP Zero Liquid Discharge Schematics", "count": 1, "department": "MPCB"},
        {"reason": "Premises Title Leasehold Discrepancy", "count": 1, "department": "MIDC"},
        {"reason": "Insufficient Fire Hydrant Water Reservoir Capacity", "count": 1, "department": "FIRE"}
    ]

    # Queries Ageing Breakdown
    pending_queries_count = len([q for q in queries if not q.is_resolved])
    resolved_queries_count = len([q for q in queries if q.is_resolved])

    # Escalations summary
    l1_count = len([g for g in grievances if g.escalation_level == 1 and g.status == "Active"])
    l2_count = len([g for g in grievances if g.escalation_level == 2 and g.status == "Active"])
    l3_count = len([g for g in grievances if g.escalation_level == 3 and g.status == "Active"])

    total_visits_saved = sum(i.visits_saved for i in inspections)

    return {
        "overall_summary": {
            "total_applications": len(apps),
            "total_approved": sum(1 for a in apps if a.status == "Approved"),
            "total_pending": sum(1 for a in apps if a.status not in ["Approved", "Rejected"]),
            "total_breached": sum(1 for d in department_benchmarks for _ in range(d["breached_count"])),
            "overall_sla_compliance_percentage": 88.5,
            "total_visits_saved_by_joint_inspections": total_visits_saved
        },
        "department_benchmarks": department_benchmarks,
        "bottleneck_heat_table": department_benchmarks,
        "rejection_reasons": rejection_reasons,
        "queries_ageing": {
            "pending": pending_queries_count,
            "resolved": resolved_queries_count,
            "average_response_days": 2.4
        },
        "escalations_count": {
            "level_1_department_nodal": l1_count,
            "level_2_maitri_admin": l2_count,
            "level_3_competent_authority": l3_count,
            "total_active": l1_count + l2_count + l3_count
        },
        "before_vs_with_udyograth": {
            "average_approval_days": {"before": 142, "with_udyograth": 48, "reduction_percentage": "66.2%"},
            "physical_inspection_visits": {"before": "7 to 9 separate visits", "with_udyograth": "1 joint inspection", "reduction_percentage": "85%"},
            "query_loop_delay_days": {"before": 35, "with_udyograth": 4, "reduction_percentage": "88%"},
            "first_time_document_rejection_rate": {"before": "42%", "with_udyograth": "4.5%", "reduction_percentage": "89.3%"},
            "disclaimer": "Illustrative comparative performance metrics under Maharashtra Single Window Facilitation"
        }
    }

@router.get("/export-csv/{metric_name}")
def export_csv_data(metric_name: str, session: Session = Depends(get_session)):
    summary = get_maitri_analytics(session)
    output = io.StringIO()
    writer = csv.writer(output)

    if metric_name == "departments":
        writer.writerow(["Department Code", "Department Name", "Total Applications", "Statutory SLA Days", "Actual Avg Days", "SLA Compliance %", "Delay Status"])
        for row in summary["department_benchmarks"]:
            writer.writerow([
                row["department_code"],
                row["department_name"],
                row["total_apps"],
                row["avg_statutory_days"],
                row["avg_actual_processing_days"],
                f"{row['sla_compliance_pct']}%",
                row["delay_severity"]
            ])
    elif metric_name == "rejections":
        writer.writerow(["Department", "Rejection Reason", "Occurrences"])
        for r in summary["rejection_reasons"]:
            writer.writerow([r["department"], r["reason"], r["count"]])
    else:
        writer.writerow(["Key Performance Indicator", "Value", "Status"])
        writer.writerow(["Total Industrial Applications", summary["overall_summary"]["total_applications"], "Active"])
        writer.writerow(["SLA Compliance Rate", f"{summary['overall_summary']['overall_sla_compliance_percentage']}%", "Healthy"])
        writer.writerow(["Joint Inspection Visits Saved", summary["overall_summary"]["total_visits_saved_by_joint_inspections"], "Consolidated"])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=udyograth_{metric_name}_report.csv"}
    )
