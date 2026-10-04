from typing import Dict, Any, Optional
from backend.adapters.base import BaseGovAdapter

class UdyamAdapter(BaseGovAdapter):
    SYSTEM_NAME = "Ministry of MSME Udyam National Registry (Simulated)"

    def verify_udyam_number(self, udyam_no: str, pan: str) -> Dict[str, Any]:
        """Simulates synchronous XML/JSON verification against national MSME registry."""
        is_valid = bool(udyam_no and udyam_no.startswith("UDYAM-MH-"))
        return {
            "adapter": self.SYSTEM_NAME,
            "is_simulated": True,
            "udyam_no": udyam_no,
            "pan": pan,
            "is_verified": is_valid,
            "enterprise_category": "Medium" if "18" in udyam_no else "Small",
            "major_activity": "Manufacturing",
            "message": "Udyam verification verified successfully via mock adapter" if is_valid else "Invalid or unverified Udyam format"
        }

udyam_adapter = UdyamAdapter()
