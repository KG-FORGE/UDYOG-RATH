from typing import Dict, Any, List

ILLUSTRATIVE_SCHEMES = [
    {
        "code": "PSI_CAPITAL_SUBSIDY",
        "name": "Package Scheme of Incentives (PSI) - Industrial Capital Subsidy",
        "authority": "Directorate of Industries, Maharashtra",
        "category": "Capital Support",
        "benefit_label": "Up to 30% to 50% of Eligible Gross Fixed Capital Investment (GFCI) (Illustrative)",
        "estimated_benefit_formula": lambda p: f"₹{round(float(p.get('investment_cr', 10)) * 0.35, 2)} Crore (Illustrative)",
        "eligibility_check": lambda p: True,
        "eligibility_reasons": [
            "Manufacturing unit setting up in notified industrial area of Maharashtra",
            "Project eligible under Maharashtra Industrial Policy 2019 / PSI 2024 provisions",
            "Enterprise commits to local employment generation of at least 80% non-managerial staff"
        ],
        "documents": [
            "Chartered Accountant Certificate of Gross Fixed Capital Investment",
            "Bank Appraisal / Sanction Letter for Term Loan",
            "MIDC Plot Possession Receipt / Land Title Deed",
            "Consent to Operate (CTO) or Consent to Establish (CTE)"
        ]
    },
    {
        "code": "PSI_ELECTRICITY_DUTY",
        "name": "Industrial Electricity Duty 100% Exemption Scheme",
        "authority": "Energy Department / Directorate of Industries",
        "category": "Operating Cost Relief",
        "benefit_label": "100% Waiver on State Electricity Duty for 7 to 10 Years (Illustrative)",
        "estimated_benefit_formula": lambda p: f"Approx ₹{round(float(p.get('power_kw', 100)) * 0.45, 1)} Lakh / year (Illustrative)",
        "eligibility_check": lambda p: float(p.get("power_kw", 0)) >= 20,
        "eligibility_reasons": [
            "Industrial power connected load meets minimum threshold of 20 kW",
            "Enterprise operates in notified development zones (B, C, D, D+)",
            "Commercial production commenced within valid sanction window"
        ],
        "documents": [
            "MSEDCL Consumer Number & Power Release Verification Letter",
            "Electrical Inspector Safety Installation Clearance",
            "Factory Licence issued by DISH"
        ]
    },
    {
        "code": "STAMP_DUTY_EXEMPTION",
        "name": "Stamp Duty and Registration Fee Remission Scheme",
        "authority": "Inspector General of Registration & Revenue Department",
        "category": "Transaction Relief",
        "benefit_label": "100% Stamp Duty Exemption on Land Lease, Purchase & Mortgage (Illustrative)",
        "estimated_benefit_formula": lambda p: f"₹{round(float(p.get('investment_cr', 5)) * 0.05, 2)} Lakh approx saving (Illustrative)",
        "eligibility_check": lambda p: p.get("stage") in ["new", "expansion"],
        "eligibility_reasons": [
            "Unit acquiring industrial land or executing loan hypothecation for new or expansion capacity",
            "Valid Letter of Intent or In-Principle Approval under MAITRI single window"
        ],
        "documents": [
            "Draft Lease Agreement / Sale Agreement / Bank Mortgage Deed",
            "MAITRI Combined Application Form (CAF) Acknowledgment"
        ]
    },
    {
        "code": "MSME_INTEREST_SUBVENTION",
        "name": "MSME 5% Term Loan Interest Subvention Scheme",
        "authority": "Directorate of Industries / MSME Development Commissioner",
        "category": "Financial Subsidy",
        "benefit_label": "5% Annual Interest Rebate on Bank Term Loan for 5 Years, Capped at ₹50 Lakh (Illustrative)",
        "estimated_benefit_formula": lambda p: "₹25 Lakh to ₹50 Lakh cumulative benefit (Illustrative)",
        "eligibility_check": lambda p: float(p.get("investment_cr", 0)) <= 50,
        "eligibility_reasons": [
            "Enterprise registered on Udyam portal as Micro or Small or Medium enterprise",
            "Term loan availed from Scheduled Commercial Bank / SIDBI for plant machinery",
            "No default or NPA status on bank account"
        ],
        "documents": [
            "Udyam MSME Registration Certificate",
            "Bank Loan Sanction Letter with Repayment Schedule",
            "Bank Non-Default Compliance Certificate"
        ]
    },
    {
        "code": "GREEN_TECH_ASSISTANCE",
        "name": "Green Technology and Zero Liquid Discharge (ZLD) Assistance",
        "authority": "Maharashtra Pollution Control Board & Industries Dept",
        "category": "Sustainability Incentive",
        "benefit_label": "50% Grant on Effluent Treatment / Solar / Water Recycling Equipment up to ₹50 Lakh (Illustrative)",
        "estimated_benefit_formula": lambda p: "Up to ₹50 Lakh capital grant (Illustrative)",
        "eligibility_check": lambda p: bool(p.get("effluent")) or bool(p.get("hazardous")),
        "eligibility_reasons": [
            "Manufacturing process generates trade effluent requiring zero liquid discharge (ZLD)",
            "Installation of advanced tertiary treatment, reverse osmosis, or solar captive systems",
            "MPCB Consent to Establish (CTE) granted with specific green tech conditions"
        ],
        "documents": [
            "Detailed Technical Project Report of Effluent Recycling / Solar Plant",
            "Vendor Invoices and Chartered Engineer Installation Certificate",
            "MPCB CTE Copy confirming green technological parameters"
        ]
    },
    {
        "code": "EXPORT_PROMOTION_SCHEME",
        "name": "Maharashtra State Industrial Export Promotion Scheme",
        "authority": "Maharashtra Industrial Export Facilitation Cell",
        "category": "Trade & Export Support",
        "benefit_label": "Reimbursement of 75% Quality Certification Costs + ₹5 Lakh Freight Subsidy (Illustrative)",
        "estimated_benefit_formula": lambda p: "₹5 Lakh - ₹15 Lakh annual export support (Illustrative)",
        "eligibility_check": lambda p: bool(p.get("export_activity")),
        "eligibility_reasons": [
            "Unit possesses valid Importer-Exporter Code (IEC) issued by DGFT",
            "Manufacturing unit engaged in direct merchandise exports from Maharashtra",
            "Applicant pursuing ISO 9001/14001, CE, or US-FDA international quality certifications"
        ],
        "documents": [
            "Valid DGFT Importer-Exporter Code (IEC) Certificate",
            "Shipping Bills / Export Invoices for the preceding financial quarter",
            "Quality Certification Fee Receipts and Accreditation Certificate"
        ]
    }
]

def match_schemes_for_profile(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Evaluates enterprise profile against the 6 illustrative schemes.
    Returns list of eligible schemes with reasons and calculated illustrative benefit.
    """
    matched = []
    for s in ILLUSTRATIVE_SCHEMES:
        is_eligible = s["eligibility_check"](profile)
        if is_eligible:
            matched.append({
                "code": s["code"],
                "name": s["name"],
                "authority": s["authority"],
                "category": s["category"],
                "benefit_label": s["benefit_label"],
                "estimated_benefit": s["estimated_benefit_formula"](profile),
                "eligibility_reasons": s["eligibility_reasons"],
                "documents": s["documents"]
            })
    return matched
