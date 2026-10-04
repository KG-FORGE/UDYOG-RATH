import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from backend.app.config import settings
from backend.models.approval import ApprovalItem, DocumentRequirement

def _evaluate_single_rule(rule: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, Any]:
    field = rule.get("field")
    operator = rule.get("operator")
    target_value = rule.get("value")

    actual_value = profile.get(field)
    if actual_value is None:
        # Default falsy values depending on target type
        if isinstance(target_value, bool):
            actual_value = False
        elif isinstance(target_value, (int, float)):
            actual_value = 0
        elif isinstance(target_value, str):
            actual_value = ""
        elif isinstance(target_value, list):
            actual_value = []

    matched = False
    if operator == "eq":
        matched = (actual_value == target_value)
    elif operator == "ne":
        matched = (actual_value != target_value)
    elif operator == "gt":
        matched = (float(actual_value) > float(target_value))
    elif operator == "gte":
        matched = (float(actual_value) >= float(target_value))
    elif operator == "lt":
        matched = (float(actual_value) < float(target_value))
    elif operator == "lte":
        matched = (float(actual_value) <= float(target_value))
    elif operator == "in":
        if isinstance(target_value, list):
            matched = (actual_value in target_value)
        else:
            matched = False
    elif operator == "contains":
        if isinstance(actual_value, list):
            matched = (target_value in actual_value)
        elif isinstance(actual_value, str):
            matched = (str(target_value).lower() in actual_value.lower())

    return matched, actual_value

def evaluate_condition_tree(condition: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """
    Recursively evaluate nested all / any conditions against profile.
    Returns (result, matched_fields_dict).
    """
    operator = condition.get("operator", "all").lower()
    rules = condition.get("rules", [])
    collected_fields = {}

    if not rules:
        return True, collected_fields

    if operator == "all":
        for r in rules:
            if "operator" in r and "rules" in r:
                sub_res, sub_fields = evaluate_condition_tree(r, profile)
                collected_fields.update(sub_fields)
                if not sub_res:
                    return False, collected_fields
            else:
                rule_res, actual_val = _evaluate_single_rule(r, profile)
                collected_fields[r.get("field")] = actual_val
                if not rule_res:
                    return False, collected_fields
        return True, collected_fields

    elif operator == "any":
        any_passed = False
        for r in rules:
            if "operator" in r and "rules" in r:
                sub_res, sub_fields = evaluate_condition_tree(r, profile)
                if sub_res:
                    any_passed = True
                    collected_fields.update(sub_fields)
            else:
                rule_res, actual_val = _evaluate_single_rule(r, profile)
                if rule_res:
                    any_passed = True
                    collected_fields[r.get("field")] = actual_val
        return any_passed, collected_fields

    return False, collected_fields

class RulesEngine:
    def __init__(self, rules_file: Path = None):
        self.rules_file = rules_file or settings.RULES_FILE
        self._ruleset = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        if not self.rules_file.exists():
            return {"version": "1.0.0", "approvals": []}
        with open(self.rules_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def reload(self):
        self._ruleset = self._load_rules()

    @property
    def ruleset(self) -> Dict[str, Any]:
        return self._ruleset

    def evaluate_profile(self, profile: Dict[str, Any]) -> List[ApprovalItem]:
        """
        Runs deterministic rule evaluation against an enterprise profile dictionary.
        Returns list of ApprovalItem objects with plain-language 'why_required' filled reason.
        """
        approvals_def = self._ruleset.get("approvals", [])
        is_fast_track = profile.get("risk_category") == "Fast Track"

        results: List[ApprovalItem] = []
        for app_def in approvals_def:
            conditions = app_def.get("conditions", {})
            applies, matched_fields = evaluate_condition_tree(conditions, profile)
            if applies:
                reason_template = app_def.get("reason_template", "Statutory requirement applicable to enterprise parameters.")
                try:
                    format_dict = {**profile, **matched_fields}
                    why_required = reason_template.format(**format_dict)
                except Exception:
                    why_required = reason_template

                sla_dict = app_def.get("sla_days", {"standard": 30, "fast_track": 15})
                sla_std = sla_dict.get("standard", 30)
                sla_fast = sla_dict.get("fast_track", 15)
                effective_sla = sla_fast if is_fast_track else sla_std

                doc_reqs = [
                    DocumentRequirement(
                        code=d.get("code"),
                        name=d.get("name"),
                        mandatory=d.get("mandatory", True),
                        validators=d.get("validators", []),
                        accepted_formats=d.get("accepted_formats", ["pdf"])
                    )
                    for d in app_def.get("documents", [])
                ]

                item = ApprovalItem(
                    id=app_def["id"],
                    name=app_def["name"],
                    authority=app_def["authority"],
                    department_code=app_def.get("department_code", "GEN"),
                    legal_basis_label=app_def["legal_basis_label"],
                    why_required=why_required,
                    prerequisites=app_def.get("prerequisites", []),
                    parallel_group=app_def.get("parallel_group", "General"),
                    sla_days=effective_sla,
                    sla_standard=sla_std,
                    sla_fast_track=sla_fast,
                    fee_label=app_def.get("fee_label", "Illustrative fee"),
                    documents=doc_reqs
                )
                results.append(item)

        return results

    def compute_timeline_comparison(self, items: List[ApprovalItem]) -> Dict[str, Any]:
        """
        Computes sequential processing days vs parallel critical path processing days.
        Groups approvals by parallel_group and determines maximum timeline per group.
        """
        sequential_days = sum(item.sla_days for item in items)

        groups: Dict[str, List[ApprovalItem]] = {}
        for item in items:
            groups.setdefault(item.parallel_group, []).append(item)

        parallel_group_timelines = []
        total_parallel_days = 0

        for group_name, group_items in sorted(groups.items()):
            max_days = max(it.sla_days for it in group_items) if group_items else 0
            total_parallel_days += max_days
            parallel_group_timelines.append({
                "group_name": group_name,
                "approvals_count": len(group_items),
                "approval_names": [it.name for it in group_items],
                "max_days": max_days,
                "items": [
                    {"id": it.id, "name": it.name, "sla_days": it.sla_days, "authority": it.authority}
                    for it in group_items
                ]
            })

        days_saved = max(0, sequential_days - total_parallel_days)
        saving_percentage = round((days_saved / sequential_days * 100) if sequential_days > 0 else 0, 1)

        return {
            "sequential_total_days": sequential_days,
            "parallel_total_days": total_parallel_days,
            "days_saved": days_saved,
            "saving_percentage": saving_percentage,
            "groups": parallel_group_timelines
        }

rules_engine = RulesEngine()
