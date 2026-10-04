from typing import Dict, Any
from backend.adapters.base import BaseGovAdapter

class MahabhulekhAdapter(BaseGovAdapter):
    SYSTEM_NAME = "Mahabhulekh Land Records (7/12 & Property Card Gateway) (Simulated)"

    def verify_plot_records(self, district: str, survey_no: str, is_midc: bool) -> Dict[str, Any]:
        return {
            "adapter": self.SYSTEM_NAME,
            "is_simulated": True,
            "district": district,
            "survey_no": survey_no,
            "zoning": "Industrial Approved" if is_midc else "Agricultural (NA Clearance Required)",
            "title_encumbrances": "Nil (Clean Title)",
            "is_verified": True,
            "message": "Simulated land record extract fetched from Mahabhulekh"
        }

mahabhulekh_adapter = MahabhulekhAdapter()

class MaitriGatewayAdapter(BaseGovAdapter):
    SYSTEM_NAME = "MAITRI Single Window State Integration Service (Simulated)"

    def forward_application(self, dept_code: str, application_ref: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "adapter": self.SYSTEM_NAME,
            "is_simulated": True,
            "destination_department": dept_code,
            "application_ref": application_ref,
            "transmission_status": "ACKNOWLEDGED_BY_DEPARTMENT",
            "statutory_tracking_id": f"MH-{dept_code}-ACK-2026-X99",
            "message": f"Application {application_ref} successfully dispatched to {dept_code} departmental workflow engine."
        }

maitri_gateway_adapter = MaitriGatewayAdapter()
