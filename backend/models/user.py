from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: str
    email: str
    role: str # "APPLICANT", "OFFICER", "ADMIN"
    department_code: Optional[str] = None # MPCB, FIRE, DISH, MSEDCL, MIDC, LABOUR, LEGAL_METROLOGY, LOCAL_BODY
    hashed_password: str
    created_at: datetime = Field(default_factory=utc_now)
