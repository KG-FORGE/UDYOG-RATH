from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class EnterpriseProfile(SQLModel, table=True):
    __tablename__ = "enterprises"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)

    # Step 1: Enterprise Details
    name: str = Field(index=True)
    constitution_type: str # "Private Limited", "LLP", "Partnership", "Sole Proprietorship", "Public Limited"
    pan: str # e.g. ABCDE1234F
    udyam_no: Optional[str] = None # e.g. UDYAM-MH-12-0012345
    registered_address: Optional[str] = None
    pin_code: Optional[str] = None

    # Step 2: Project Details
    sector: str # "engineering", "food processing", "textiles", "chemicals", "plastics", "pharmaceuticals", "electronics"
    activity_description: str
    stage: str # "new", "expansion", "operating", "renewal"

    # Step 3: Scale and Location
    investment_cr: float # Investment in Rupees Crore
    employees: int # Total workforce count
    power_kw: float # Power requirement in kW
    water_kld: float # Water requirement in KLD (kilo litres per day)
    district: str # e.g. Pune, Ratnagiri, Nagpur, Thane, Aurangabad
    is_midc: bool = True # Situated in MIDC Industrial Area or Non-MIDC
    midc_area_name: Optional[str] = None # e.g. Chakan Industrial Area Phase II
    land_type: str = "Industrial Lease" # "Industrial Lease", "Private Freehold", "Agricultural Converted"

    # Step 4: Hazard Flags & Activity Indicators
    hazardous: bool = False # Involves hazardous materials or processes
    effluent: bool = False # Generates industrial trade effluent
    boiler: bool = False # Involves steam boiler / pressure vessel
    explosives: bool = False # Involves storage/use of explosives
    storage_flammables: bool = False # Involves bulk storage of flammables/solvents
    export_activity: bool = False # Involves international export of goods/services

    # Calculated Risk Metrics
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None # "Fast Track", "Standard", "Detailed Scrutiny"

    # Verified Data Vault Status
    pan_verified: bool = False
    udyam_verified: bool = False
    land_verified: bool = False
    address_verified: bool = False

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
