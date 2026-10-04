import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

def create_sample_pdf(filepath: Path, title: str, lines: list):
    c = canvas.Canvas(str(filepath), pagesize=letter)
    width, height = letter

    # Government / Formal style border
    c.setStrokeColor(colors.HexColor("#17375E"))
    c.setLineWidth(2)
    c.rect(30, 30, width - 60, height - 60)

    c.setFillColor(colors.HexColor("#17375E"))
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2.0, height - 70, title)

    c.setStrokeColor(colors.HexColor("#E8871E"))
    c.setLineWidth(1)
    c.line(50, height - 85, width - 50, height - 85)

    c.setFillColor(colors.HexColor("#1B1B1B"))
    c.setFont("Helvetica", 11)

    y = height - 120
    for line in lines:
        if line.startswith("## "):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.HexColor("#1F4E8C"))
            c.drawString(60, y, line[3:])
            y -= 22
            c.setFont("Helvetica", 11)
            c.setFillColor(colors.HexColor("#1B1B1B"))
        elif line.startswith("**"):
            c.setFont("Helvetica-Bold", 11)
            c.drawString(60, y, line.replace("**", ""))
            y -= 18
            c.setFont("Helvetica", 11)
        else:
            c.drawString(60, y, line)
            y -= 18

    # Bottom disclaimer stamp
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawCentredString(width / 2.0, 50, "UDYOGRATH SIH26130 DEMO SAMPLE DOCUMENT - ILLUSTRATIVE DATA ONLY")

    c.save()

def generate_all_samples():
    # 1. Valid PAN Card for Sahyadri
    create_sample_pdf(
        SAMPLES_DIR / "sahyadri_pan.pdf",
        "INCOME TAX DEPARTMENT - PERMANENT ACCOUNT NUMBER CARD",
        [
            "## GOVERNMENT OF INDIA / भारत सरकार",
            "**Name of Entity:** Sahyadri Precision Components Pvt. Ltd.",
            "**Permanent Account Number (PAN):** AABCS1234F",
            "**Date of Incorporation:** 15/06/2021",
            "**Constitution Type:** Private Limited Company",
            "**Registered State:** Maharashtra (Code 27)",
            "**Factory Address:** Plot No. C-44, MIDC Chakan Phase II, Pune - 410501",
            "",
            "This document is an illustrative demonstration artifact for UDYOGRATH platform."
        ]
    )

    # 2. Valid Incorporation Certificate
    create_sample_pdf(
        SAMPLES_DIR / "sahyadri_incorporation.pdf",
        "MINISTRY OF CORPORATE AFFAIRS - CERTIFICATE OF INCORPORATION",
        [
            "## ROC PUNE, MAHARASHTRA",
            "**Corporate Identification Number (CIN):** U29200PN2021PTC199882",
            "**Enterprise Name:** Sahyadri Precision Components Pvt. Ltd.",
            "**Date of Registration:** 15 June 2021",
            "**Authorized Share Capital:** INR 20,00,00,000",
            "**Paid up Capital:** INR 18,00,00,000",
            "**Registered Office:** Plot C-44, MIDC Chakan Phase II, Pune, Maharashtra 410501",
            "**PAN Reference:** AABCS1234F",
            "",
            "Certified true copy issued for statutory industrial approvals."
        ]
    )

    # 3. Valid MIDC Plot Allotment Letter
    create_sample_pdf(
        SAMPLES_DIR / "sahyadri_land_allotment.pdf",
        "MAHARASHTRA INDUSTRIAL DEVELOPMENT CORPORATION (MIDC)",
        [
            "## INDUSTRIAL ALLOTMENT ORDER",
            "**Reference No:** MIDC/RO-PUNE/ALLOT/2025/1104",
            "**Allottee:** Sahyadri Precision Components Pvt. Ltd.",
            "**Plot Number:** C-44, Area: 10,000 sq. meters",
            "**Industrial Area:** Chakan Phase II Industrial Area, Taluka Khed, District Pune",
            "**Zoning:** Engineering & Automobile Ancillary Zone",
            "**Possession Date:** 10/01/2025",
            "**Water Connection Allocation:** 40 KLD sanctioned",
            "**Power Feasibility:** 400 kW connected load approved by MSEDCL",
            "",
            "Issued under the authority of Regional Officer, MIDC Pune."
        ]
    )

    # 4. FLAWED DOCUMENT 1: Enterprise Name Mismatch (Sahyadri Precision Comp. vs Sahyadri Precision Components Pvt. Ltd.)
    create_sample_pdf(
        SAMPLES_DIR / "sahyadri_mismatched_doc.pdf",
        "PREMISES LEASE AGREEMENT & POWER NOC (DEMO FLAWED DOCUMENT)",
        [
            "## COMMERCIAL CONTRACT & LEASE DEED",
            "**Lessee Name on Document:** Sahyadri Precision Comp.",
            "**Lessor:** Maharashtra Industrial Development Estates",
            "**Factory Plot:** Plot C-44, MIDC Chakan Phase II, Pune 410501",
            "**PAN Declared:** AABCS1234F",
            "",
            "**DEMO NOTE:**",
            "The legal entity name on this document is truncated as 'Sahyadri Precision Comp.'",
            "instead of the full profile legal name 'Sahyadri Precision Components Pvt. Ltd.'",
            "The UDYOGRATH RapidFuzz validator will detect this discrepancy (<85% similarity)",
            "and display a plain-language actionable fix to the entrepreneur."
        ]
    )

    # 5. FLAWED DOCUMENT 2: Expired Certificate (Valid until: 2023-12-31)
    create_sample_pdf(
        SAMPLES_DIR / "sahyadri_expired_cert.pdf",
        "DIRECTORATE OF INDUSTRIAL SAFETY & HEALTH - STABILITY CERTIFICATE",
        [
            "## STRUCTURAL STABILITY CERTIFICATION",
            "**Issued To:** Sahyadri Precision Components Pvt. Ltd.",
            "**Plant Premises:** Plot C-44, MIDC Chakan Phase II, Pune 410501",
            "**Date of Inspection:** 01/01/2023",
            "**Valid until:** 2023-12-31",
            "",
            "**DEMO NOTE:**",
            "This statutory certification expired on 2023-12-31.",
            "The UDYOGRATH date validator will flag this as a critical Fail with remedial instructions."
        ]
    )

    # 6. Sample for Konkan Fresh Foods
    create_sample_pdf(
        SAMPLES_DIR / "konkan_fssai_plan.pdf",
        "FOOD SAFETY & STANDARDS AUTHORITY OF INDIA (FSSAI) PLAN",
        [
            "## FOOD SAFETY MANAGEMENT SYSTEM (FSMS) SCHEME",
            "**Entity Name:** Konkan Fresh Foods LLP",
            "**Location:** Plot B-12, Mirjole Industrial Area, Ratnagiri 415612",
            "**Sector:** Food Processing - Alphonso Mango Pulp & Fruit Beverages",
            "**Capital Outlay:** INR 3.50 Crore",
            "**PAN:** AAFCK9876G",
            "**Potable Water Testing:** Compliant with IS 10500 standards",
            "",
            "Submitted for expedited Fast-Track processing under UDYOGRATH."
        ]
    )

    # 7. Sample for Vidarbha Agro Chemicals
    create_sample_pdf(
        SAMPLES_DIR / "vidarbha_eia_report.pdf",
        "STATE ENVIRONMENT IMPACT ASSESSMENT AUTHORITY (SEIAA) - EIA REPORT",
        [
            "## ENVIRONMENTAL IMPACT APPRAISAL EXECUTIVE SUMMARY",
            "**Enterprise:** Vidarbha Agro Chemicals Pvt. Ltd.",
            "**Plant Location:** Plot D-8, Butibori Industrial Zone, Nagpur 441122",
            "**Sector:** Agro Chemicals & Synthetic Pesticides Formulation",
            "**Capital Investment:** INR 60.00 Crore",
            "**PAN:** AABCV5544H",
            "**Hazardous Chemicals:** Schedule I List Inorganics & Flammable Solvents",
            "**Effluent Discharge:** 250 KLD with dedicated ZLD Multiple Effect Evaporator",
            "**High-Pressure Boiler:** 10 TPH Steam Boiler installed",
            "",
            "Risk classification: Detailed Scrutiny with mandatory joint inspection."
        ]
    )

    print(f"Sample documents successfully generated in {SAMPLES_DIR}")

if __name__ == "__main__":
    generate_all_samples()
