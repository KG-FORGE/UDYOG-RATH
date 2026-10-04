from typing import Dict, Any

class BaseGovAdapter:
    """
    Base simulated connector for Government of Maharashtra and Central departmental systems.
    Clearly marked as simulated architecture to demonstrate seamless plug-and-play capability
    with real live APIs (MeeSeva / Aaple Sarkar, GSTN, Mahabhulekh, Udyam, DigiLocker).
    """
    SYSTEM_NAME: str = "Base Government Gateway"
    IS_SIMULATED: bool = True
    SIMULATION_DISCLAIMER: str = "Simulated API Adapter for Hackathon Demonstration. Zero external calls made."

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "system_name": self.SYSTEM_NAME,
            "is_simulated": self.IS_SIMULATED,
            "disclaimer": self.SIMULATION_DISCLAIMER
        }
