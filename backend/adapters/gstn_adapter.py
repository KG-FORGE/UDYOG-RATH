from typing import Dict, Any
from backend.adapters.base import BaseGovAdapter

class GSTNAdapter(BaseGovAdapter):
    SYSTEM_NAME = "Goods and Services Tax Network (GSTN) Gateway (Simulated)"

    def verify_gstin(self, gstin: str) -> Dict[str, Any]:
        is_valid = len(gstin) == 15 and gstin.startswith("27") # 27 is Maharashtra state code
        return {
            "adapter": self.SYSTEM_NAME,
            "is_simulated": True,
            "gstin": gstin,
            "state_code": "27 (Maharashtra)",
            "is_active": is_valid,
            "taxpayer_type": "Regular",
            "message": "GSTIN verified active in Maharashtra jurisdiction" if is_valid else "Simulated: GSTIN pending or non-Maharashtra"
        }

gstn_adapter = GSTNAdapter()
