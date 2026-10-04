import pytest
from backend.services.risk import compute_risk_profile

def test_01_sahyadri_standard_risk_category():
    sahyadri = {
        "sector": "engineering",
        "investment_cr": 18.0,
        "employees": 120,
        "power_kw": 400.0,
        "hazardous": False,
        "effluent": False,
        "boiler": False,
        "storage_flammables": False,
        "is_midc": True
    }
    res = compute_risk_profile(sahyadri)
    assert res["risk_category"] == "Standard"
    assert 35.0 <= res["risk_score"] < 70.0
    assert len(res["factors"]) > 0

def test_02_konkan_fast_track_category():
    konkan = {
        "sector": "food processing",
        "investment_cr": 3.5,
        "hazardous": False,
        "effluent": False,
        "boiler": False,
        "storage_flammables": False,
        "is_midc": True
    }
    res = compute_risk_profile(konkan)
    assert res["risk_category"] == "Fast Track"
    assert res["risk_score"] < 35.0

def test_03_vidarbha_detailed_scrutiny_category():
    vidarbha = {
        "sector": "chemicals",
        "investment_cr": 60.0,
        "hazardous": True,
        "effluent": True,
        "boiler": True,
        "storage_flammables": True,
        "is_midc": True
    }
    res = compute_risk_profile(vidarbha)
    assert res["risk_category"] == "Detailed Scrutiny"
    assert res["risk_score"] >= 70.0
    # Check that high weights were added
    weights = [f["weight"] for f in res["factors"]]
    assert 30 in weights # chemicals sector
    assert 20 in weights # hazardous
    assert 20 in weights # >50 Cr
    assert 15 in weights # effluent
