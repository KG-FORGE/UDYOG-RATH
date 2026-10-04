from typing import Dict, Any, List

def compute_risk_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes deterministic risk score (0-100) and scrutiny category.
    Fast Track: < 35
    Standard: 35 to 69
    Detailed Scrutiny: >= 70
    """
    factors: List[Dict[str, Any]] = []
    total_score = 0.0

    # 1. Sector Hazard Classification
    sector = str(profile.get("sector", "")).lower()
    sector_score = 0
    sector_desc = ""
    if sector in ["chemicals", "pharmaceuticals"]:
        sector_score = 30
        sector_desc = "High-hazard industrial chemical/pharma sector"
    elif sector in ["engineering", "plastics"]:
        sector_score = 15
        sector_desc = "Moderate-hazard manufacturing sector"
    elif sector in ["textiles"]:
        sector_score = 10
        sector_desc = "Low-moderate environmental sensitivity"
    else: # food processing, electronics, other
        sector_score = 5
        sector_desc = "Low-hazard industrial classification"
    total_score += sector_score
    factors.append({"factor": "Sector Hazard Class", "detail": f"{sector.capitalize()}: {sector_desc}", "weight": sector_score})

    # 2. Capital Investment Scale
    inv = float(profile.get("investment_cr", 0.0))
    inv_score = 0
    if inv >= 50.0:
        inv_score = 20
        inv_desc = f"Large Mega project (₹{inv} Cr >= ₹50 Cr)"
    elif inv >= 10.0:
        inv_score = 10
        inv_desc = f"Medium scale enterprise (₹{inv} Cr)"
    else:
        inv_score = 5
        inv_desc = f"Micro / Small enterprise scale (₹{inv} Cr < ₹10 Cr)"
    total_score += inv_score
    factors.append({"factor": "Capital Investment Scale", "detail": inv_desc, "weight": inv_score})

    # 3. Workforce Scale & Occupational Exposure
    emp = int(profile.get("employees", 0))
    emp_score = 10 if emp >= 100 else (5 if emp >= 50 else 0)
    total_score += emp_score
    factors.append({
        "factor": "Workforce Scale",
        "detail": f"{emp} workers ({'Large workforce >= 100' if emp >= 100 else 'Standard workforce'})",
        "weight": emp_score
    })

    # 4. Connected Electrical Power Load
    pwr = float(profile.get("power_kw", 0.0))
    pwr_score = 10 if pwr >= 200 else (5 if pwr >= 50 else 0)
    total_score += pwr_score
    factors.append({
        "factor": "Electrical Connected Load",
        "detail": f"{pwr} kW ({'High capacity load >= 200 kW' if pwr >= 200 else 'Moderate / Low load'})",
        "weight": pwr_score
    })

    # 5. Hazardous Materials Flag
    is_haz = bool(profile.get("hazardous", False))
    haz_score = 20 if is_haz else 0
    total_score += haz_score
    factors.append({
        "factor": "Hazardous Materials Handling",
        "detail": "Involves Schedule I/II hazardous chemicals" if is_haz else "No declared hazardous chemicals",
        "weight": haz_score
    })

    # 4. Industrial Effluent Generation
    is_eff = bool(profile.get("effluent", False))
    eff_score = 15 if is_eff else 0
    total_score += eff_score
    factors.append({
        "factor": "Trade Effluent Generation",
        "detail": "Requires full ETP & zero liquid discharge compliance" if is_eff else "Dry process / domestic sewage only",
        "weight": eff_score
    })

    # 5. Steam Boiler / Pressure Vessel
    is_boiler = bool(profile.get("boiler", False))
    boiler_score = 10 if is_boiler else 0
    total_score += boiler_score
    factors.append({
        "factor": "Steam Boiler / Pressure Vessel",
        "detail": "High-pressure thermal equipment operating on site" if is_boiler else "No boiler installation",
        "weight": boiler_score
    })

    # 6. Bulk Flammables Storage
    is_flam = bool(profile.get("storage_flammables", False))
    flam_score = 10 if is_flam else 0
    total_score += flam_score
    factors.append({
        "factor": "Flammable Solvent / Fuel Storage",
        "detail": "Bulk storage exceeding threshold quantities" if is_flam else "Normal packaging storage",
        "weight": flam_score
    })

    # 7. MIDC Industrial Estate Location (Zoned estate reduces land/environmental risk)
    is_midc = bool(profile.get("is_midc", True))
    loc_score = 0 if is_midc else 5
    total_score += loc_score
    factors.append({
        "factor": "Zoning & Estate Infrastructure",
        "detail": "Located in planned MIDC Industrial Zone (common infra present)" if is_midc else "Standalone Non-MIDC location (higher local risk)",
        "weight": loc_score
    })

    # Clamp total score between 0 and 100
    final_score = min(100.0, max(0.0, float(total_score)))

    if final_score < 35:
        category = "Fast Track"
        description = "Eligible for expedited self-certification and fast-track SLA processing."
    elif final_score < 70:
        category = "Standard"
        description = "Standard statutory desk scrutiny and standard timeline verification."
    else:
        category = "Detailed Scrutiny"
        description = "High-risk unit: mandatory multi-agency joint inspection and detailed technical appraisal required."

    return {
        "risk_score": final_score,
        "risk_category": category,
        "description": description,
        "factors": factors
    }
