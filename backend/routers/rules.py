import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.database import get_session
from backend.models.enterprise import EnterpriseProfile
from backend.models.application import Application
from backend.services.rules_engine import rules_engine, evaluate_condition_tree
from backend.services.audit import append_audit_entry

router = APIRouter(prefix="/api/rules", tags=["Rules Engine"])

class RuleVersionSaveRequest(BaseModel):
    version: str
    description: str
    approvals: List[Dict[str, Any]]

class RuleSandboxTestRequest(BaseModel):
    profile: Dict[str, Any]
    approval_rule: Dict[str, Any]

@router.get("")
def get_rules_metadata():
    ruleset = rules_engine.ruleset
    return {
        "version": ruleset.get("version", "1.0.0"),
        "name": ruleset.get("name"),
        "updated_at": ruleset.get("updated_at"),
        "description": ruleset.get("description"),
        "disclaimer": ruleset.get("disclaimer"),
        "total_approvals": len(ruleset.get("approvals", [])),
        "available_versions": ["1.0.0"]
    }

@router.get("/current-json")
def get_current_rules_json():
    return rules_engine.ruleset

@router.get("/evaluate/{enterprise_id}")
def evaluate_enterprise_approvals(enterprise_id: int, session: Session = Depends(get_session)):
    ent = session.get(EnterpriseProfile, enterprise_id)
    if not ent:
        raise HTTPException(status_code=404, detail="Enterprise profile not found")

    profile_dict = {
        "sector": ent.sector,
        "stage": ent.stage,
        "investment_cr": ent.investment_cr,
        "employees": ent.employees,
        "power_kw": ent.power_kw,
        "water_kld": ent.water_kld,
        "district": ent.district,
        "is_midc": ent.is_midc,
        "hazardous": ent.hazardous,
        "effluent": ent.effluent,
        "boiler": ent.boiler,
        "explosives": ent.explosives,
        "storage_flammables": ent.storage_flammables,
        "export_activity": ent.export_activity,
        "risk_category": ent.risk_category
    }

    approvals = rules_engine.evaluate_profile(profile_dict)
    timeline_comparison = rules_engine.compute_timeline_comparison(approvals)

    # Check if application has already been submitted for each approval
    apps = session.exec(select(Application).where(Application.enterprise_id == enterprise_id)).all()
    app_map = {a.approval_id: a for a in apps}

    output_approvals = []
    for app in approvals:
        existing_app = app_map.get(app.id)
        app.applied = existing_app is not None
        if existing_app:
            app.application_id = existing_app.id
            app.application_ref = existing_app.ref_no
            app.application_status = existing_app.status
        output_approvals.append(app)

    return {
        "enterprise_id": enterprise_id,
        "enterprise_name": ent.name,
        "risk_category": ent.risk_category,
        "total_required": len(output_approvals),
        "approvals": output_approvals,
        "timeline_comparison": timeline_comparison
    }

@router.post("/save-version")
def save_new_rule_version(req: RuleVersionSaveRequest, session: Session = Depends(get_session)):
    new_data = {
        "version": req.version,
        "name": f"Maharashtra Industrial Regulatory Ruleset v{req.version}",
        "updated_at": "2026-10-04T00:00:00Z",
        "description": req.description,
        "disclaimer": "Illustrative prototype data. Verify with the competent authority.",
        "approvals": req.approvals
    }

    # Save to rules folder
    ver_filename = f"v{req.version.replace('.', '_')}_rules.json"
    ver_path = settings.RULES_FILE.parent / ver_filename
    with open(ver_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2)

    # Overwrite active rules file
    with open(settings.RULES_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2)

    rules_engine.reload()

    append_audit_entry(
        session=session,
        actor="admin_maitri",
        role="ADMIN",
        action="RULE_VERSION_PUBLISHED",
        resource_type="Rulebook",
        resource_id=req.version,
        details=f"Published ruleset version {req.version} containing {len(req.approvals)} approvals."
    )

    return {"status": "success", "message": f"Ruleset version {req.version} saved and activated."}

@router.post("/test-sandbox")
def test_rule_sandbox(req: RuleSandboxTestRequest):
    """Allows testing an individual rule condition tree against simulated enterprise profile."""
    conditions = req.approval_rule.get("conditions", {})
    applies, matched_fields = evaluate_condition_tree(conditions, req.profile)
    reason_template = req.approval_rule.get("reason_template", "Applies based on condition matching.")
    try:
        format_dict = {**req.profile, **matched_fields}
        reason = reason_template.format(**format_dict)
    except Exception:
        reason = reason_template

    return {
        "applies": applies,
        "matched_fields": matched_fields,
        "generated_reason": reason
    }
