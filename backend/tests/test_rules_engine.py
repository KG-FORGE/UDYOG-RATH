import pytest
from backend.services.rules_engine import rules_engine, evaluate_condition_tree

# Base test profile
BASE_PROFILE = {
    "sector": "engineering",
    "stage": "new",
    "investment_cr": 18.0,
    "employees": 120,
    "power_kw": 400.0,
    "water_kld": 40.0,
    "district": "Pune",
    "is_midc": True,
    "hazardous": False,
    "effluent": False,
    "boiler": False,
    "storage_flammables": False,
    "export_activity": True
}

def test_01_udyam_applies_when_investment_lte_50_cr():
    profile = {**BASE_PROFILE, "investment_cr": 15.0}
    approvals = rules_engine.evaluate_profile(profile)
    ids = [a.id for a in approvals]
    assert "UDYAM_REG" in ids

def test_02_udyam_does_not_apply_for_mega_over_50_cr():
    profile = {**BASE_PROFILE, "investment_cr": 75.0}
    approvals = rules_engine.evaluate_profile(profile)
    ids = [a.id for a in approvals]
    assert "UDYAM_REG" not in ids

def test_03_gst_always_applies_for_commercial_units():
    approvals = rules_engine.evaluate_profile(BASE_PROFILE)
    ids = [a.id for a in approvals]
    assert "GST_REG" in ids

def test_04_epfo_esic_applies_for_workforce_gte_10():
    profile = {**BASE_PROFILE, "employees": 25}
    approvals = rules_engine.evaluate_profile(profile)
    ids = [a.id for a in approvals]
    assert "EPFO_ESIC_REG" in ids

def test_05_contract_labour_applies_only_when_employees_gte_50():
    profile_small = {**BASE_PROFILE, "employees": 30}
    profile_large = {**BASE_PROFILE, "employees": 75}
    assert "CONTRACT_LABOUR" not in [a.id for a in rules_engine.evaluate_profile(profile_small)]
    assert "CONTRACT_LABOUR" in [a.id for a in rules_engine.evaluate_profile(profile_large)]

def test_06_na_order_required_only_for_non_midc_land():
    midc_profile = {**BASE_PROFILE, "is_midc": True}
    non_midc_profile = {**BASE_PROFILE, "is_midc": False}
    assert "NA_ORDER" not in [a.id for a in rules_engine.evaluate_profile(midc_profile)]
    assert "NA_ORDER" in [a.id for a in rules_engine.evaluate_profile(non_midc_profile)]

def test_07_building_permit_required_for_new_and_expansion_stage():
    new_profile = {**BASE_PROFILE, "stage": "new"}
    op_profile = {**BASE_PROFILE, "stage": "operating"}
    assert "BUILDING_PERMIT" in [a.id for a in rules_engine.evaluate_profile(new_profile)]
    assert "BUILDING_PERMIT" not in [a.id for a in rules_engine.evaluate_profile(op_profile)]

def test_08_environmental_clearance_for_chemicals_or_large_outlay():
    chem_profile = {**BASE_PROFILE, "sector": "chemicals", "investment_cr": 20.0}
    assert "ENV_CLEARANCE" in [a.id for a in rules_engine.evaluate_profile(chem_profile)]

def test_09_environmental_clearance_not_required_for_small_engineering():
    small_eng = {**BASE_PROFILE, "sector": "engineering", "investment_cr": 10.0}
    assert "ENV_CLEARANCE" not in [a.id for a in rules_engine.evaluate_profile(small_eng)]

def test_10_mpcb_cte_triggered_by_effluent_flag():
    eff_profile = {**BASE_PROFILE, "effluent": True}
    assert "MPCB_CTE" in [a.id for a in rules_engine.evaluate_profile(eff_profile)]

def test_11_boiler_registration_triggered_by_boiler_flag():
    no_boiler = {**BASE_PROFILE, "boiler": False}
    with_boiler = {**BASE_PROFILE, "boiler": True}
    assert "BOILER_REG" not in [a.id for a in rules_engine.evaluate_profile(no_boiler)]
    assert "BOILER_REG" in [a.id for a in rules_engine.evaluate_profile(with_boiler)]

def test_12_food_safety_licence_only_applies_to_food_sector():
    food_profile = {**BASE_PROFILE, "sector": "food processing"}
    eng_profile = {**BASE_PROFILE, "sector": "engineering"}
    assert "FOOD_SAFETY_LIC" in [a.id for a in rules_engine.evaluate_profile(food_profile)]
    assert "FOOD_SAFETY_LIC" not in [a.id for a in rules_engine.evaluate_profile(eng_profile)]

def test_13_drug_mfg_licence_only_applies_to_pharma():
    pharma_profile = {**BASE_PROFILE, "sector": "pharmaceuticals"}
    assert "DRUG_MFG_LIC" in [a.id for a in rules_engine.evaluate_profile(pharma_profile)]

def test_14_iec_code_triggered_by_export_activity():
    export_yes = {**BASE_PROFILE, "export_activity": True}
    export_no = {**BASE_PROFILE, "export_activity": False}
    assert "IEC_CODE" in [a.id for a in rules_engine.evaluate_profile(export_yes)]
    assert "IEC_CODE" not in [a.id for a in rules_engine.evaluate_profile(export_no)]

def test_15_why_required_reason_template_is_interpolated():
    approvals = rules_engine.evaluate_profile(BASE_PROFILE)
    udyam_app = next(a for a in approvals if a.id == "UDYAM_REG")
    assert "18" in udyam_app.why_required or "18.0" in udyam_app.why_required
    assert "{" not in udyam_app.why_required # No raw uninterpolated braces

def test_16_parallel_timeline_computation_shows_savings():
    approvals = rules_engine.evaluate_profile(BASE_PROFILE)
    comparison = rules_engine.compute_timeline_comparison(approvals)
    assert comparison["sequential_total_days"] > comparison["parallel_total_days"]
    assert comparison["days_saved"] > 0
    assert comparison["saving_percentage"] > 20.0
