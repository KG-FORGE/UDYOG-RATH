import os
import re
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from rapidfuzz import fuzz
import pdfplumber

PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
PIN_REGEX = re.compile(r"\b[1-9][0-9]{5}\b")
DATE_REGEX = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b")

def extract_pdf_data(file_path: str) -> Dict[str, Any]:
    """
    Extract text, PAN, PIN, and dates from uploaded PDF document using pdfplumber and regex.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages[:5]: # Extract first 5 pages max
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
    except Exception as e:
        extracted_text = f"Text extraction warning: {str(e)}"

    pan_matches = PAN_REGEX.findall(extracted_text)
    pin_matches = PIN_REGEX.findall(extracted_text)
    date_matches = DATE_REGEX.findall(extracted_text)

    # Heuristic for enterprise name: check lines with Ltd, Pvt, LLP, Industries, or capitalized entity words
    probable_name = None
    lines = [line.strip() for line in extracted_text.split("\n") if len(line.strip()) > 3]
    for line in lines:
        if any(keyword in line.upper() for keyword in ["PVT", "LTD", "LIMITED", "LLP", "COMPONENTS", "INDUSTRIES", "ENTERPRISE", "FOODS", "CHEMICALS"]):
            # Clean up unwanted header prefixes if present
            clean_line = re.sub(r"^(M/s|Name of Unit|Name of Entity|Company Name|Firm Name|Enterprise Name|Entity Name|Lessee Name on Document|Allottee)[:\s-]*", "", line, flags=re.I).strip()
            if len(clean_line) >= 4 and len(clean_line) <= 80:
                probable_name = clean_line
                break

    return {
        "text_preview": extracted_text[:1000],
        "extracted_name": probable_name,
        "extracted_pan": pan_matches[0] if pan_matches else None,
        "extracted_pin": pin_matches[0] if pin_matches else None,
        "dates_found": date_matches,
        "raw_text_length": len(extracted_text)
    }

def validate_document(
    file_path: str,
    doc_code: str,
    profile_name: str,
    profile_pan: Optional[str] = None,
    profile_pin: Optional[str] = None,
    system_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Validates uploaded document against enterprise profile attributes.
    Returns:
    - status: "Pass", "Warning", "Fail"
    - name_match_score: 0 to 100
    - is_expired: bool
    - readiness_contribution: 0 to 100
    - issues: list of dicts with issue, fix, and severity
    - extracted_fields: dict
    """
    issues = []
    status = "Pass"
    readiness_contrib = 100.0
    current_dt = system_date or datetime.utcnow().date()

    if not os.path.exists(file_path):
        return {
            "status": "Fail",
            "name_match_score": 0.0,
            "is_expired": False,
            "readiness_contribution": 0.0,
            "issues": [{"issue": "File not found on server", "fix": "Please re-upload the document.", "severity": "error"}],
            "extracted_fields": {}
        }

    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if file_size_mb > 5.0:
        issues.append({
            "issue": f"File size exceeds statutory 5 MB limit ({file_size_mb:.2f} MB)",
            "fix": "Compress or optimize PDF to under 5 MB before submission.",
            "severity": "error"
        })
        status = "Fail"
        readiness_contrib -= 40.0

    # Extract text from PDF
    extraction = extract_pdf_data(file_path)
    extracted_name = extraction.get("extracted_name")
    extracted_pan = extraction.get("extracted_pan")
    extracted_pin = extraction.get("extracted_pin")

    # Name matching check using rapidfuzz token_sort_ratio and token_set_ratio
    name_match_score = 100.0
    if extracted_name and profile_name:
        score_sort = fuzz.token_sort_ratio(extracted_name.lower(), profile_name.lower())
        score_set = fuzz.token_set_ratio(extracted_name.lower(), profile_name.lower())
        name_match_score = round(max(score_sort, score_set), 1)
        if name_match_score < 85.0:
            issues.append({
                "issue": f"Name on the document differs from enterprise profile: '{extracted_name}' vs '{profile_name}' (Match: {name_match_score}%)",
                "fix": "Upload a document bearing the exact registered legal entity name, or submit an official name change affidavit.",
                "severity": "error" if name_match_score < 70.0 else "warning"
            })
            if name_match_score < 70.0:
                status = "Fail"
                readiness_contrib -= 50.0
            else:
                if status != "Fail":
                    status = "Warning"
                readiness_contrib -= 25.0

    # PAN check if document is PAN card or contains PAN
    if doc_code == "PAN_CARD":
        if extracted_pan and profile_pan:
            if extracted_pan.upper() != profile_pan.upper():
                issues.append({
                    "issue": f"PAN in document ({extracted_pan}) does not match profile PAN ({profile_pan})",
                    "fix": "Upload the correct PAN card corresponding to the enterprise PAN.",
                    "severity": "error"
                })
                status = "Fail"
                readiness_contrib -= 50.0

    # PIN code / Address consistency check
    if profile_pin and extracted_pin:
        if extracted_pin != profile_pin:
            issues.append({
                "issue": f"Postal PIN code on document ({extracted_pin}) differs from registered factory PIN ({profile_pin})",
                "fix": "Ensure all premises proofs and lease agreements specify the actual plant PIN code.",
                "severity": "warning"
            })
            if status != "Fail":
                status = "Warning"
            readiness_contrib -= 15.0

    # Expiry date check
    is_expired = False
    expiry_date_str = None
    dates_found = extraction.get("dates_found", [])
    # Search for expiry keywords in text
    lower_preview = extraction.get("text_preview", "").lower()
    if "valid until" in lower_preview or "expiry date" in lower_preview or "valid up to" in lower_preview or "expired" in lower_preview:
        # Check parsed dates
        for dt_cand in dates_found:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    d = datetime.strptime(dt_cand, fmt).date()
                    if d < current_dt:
                        is_expired = True
                        expiry_date_str = d.isoformat()
                        issues.append({
                            "issue": f"Document validity has expired on {expiry_date_str} (Prior to current date {current_dt})",
                            "fix": "Renew the certificate/licence with the issuing authority and upload the renewed copy.",
                            "severity": "error"
                        })
                        status = "Fail"
                        readiness_contrib -= 60.0
                        break
                except ValueError:
                    continue
            if is_expired:
                break

    readiness_contrib = max(0.0, min(100.0, readiness_contrib))

    return {
        "status": status,
        "name_match_score": name_match_score,
        "is_expired": is_expired,
        "expiry_date": expiry_date_str,
        "readiness_contribution": readiness_contrib,
        "issues": issues,
        "extracted_fields": {
            "enterprise_name": extracted_name or profile_name,
            "pan": extracted_pan or profile_pan,
            "pin_code": extracted_pin or profile_pin,
            "is_prototype_extraction": extracted_name is None
        }
    }

def calculate_overall_readiness(
    approval_items: List[Any],
    uploaded_docs: List[Any]
) -> Dict[str, Any]:
    """
    Computes overall readiness score (0-100) across all required approvals and documents.
    """
    total_mandatory_docs = 0
    uploaded_mandatory_docs = 0
    score_sum = 0.0

    uploaded_map = {(d.approval_id, d.document_code): d for d in uploaded_docs}

    per_approval_readiness = []

    for app in approval_items:
        app_docs = app.documents
        app_mandatory = [d for d in app_docs if d.mandatory]
        app_total_score = 0.0

        for req in app_docs:
            if req.mandatory:
                total_mandatory_docs += 1
            up_doc = uploaded_map.get((app.id, req.code))
            if up_doc:
                if req.mandatory:
                    uploaded_mandatory_docs += 1
                doc_score = getattr(up_doc, "readiness_score_contribution", 100.0)
                app_total_score += doc_score
            else:
                # Missing document gets 0
                app_total_score += 0.0

        app_avg = round((app_total_score / len(app_docs)) if app_docs else 100.0, 1)
        score_sum += app_avg

        per_approval_readiness.append({
            "approval_id": app.id,
            "approval_name": app.name,
            "authority": app.authority,
            "readiness_score": app_avg,
            "documents_count": len(app_docs),
            "uploaded_count": sum(1 for req in app_docs if (app.id, req.code) in uploaded_map)
        })

    overall_score = round((score_sum / len(approval_items)) if approval_items else 100.0, 1)
    can_submit = overall_score >= 80.0

    return {
        "overall_score": overall_score,
        "can_submit": can_submit,
        "total_mandatory_docs": total_mandatory_docs,
        "uploaded_mandatory_docs": uploaded_mandatory_docs,
        "per_approval": per_approval_readiness
    }
