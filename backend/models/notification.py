from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from backend.models.common import utc_now

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    recipient_email: str = Field(index=True)
    recipient_phone: Optional[str] = None
    recipient_name: str
    channel: str = "IN_APP" # "IN_APP", "SMS", "EMAIL"
    title: str
    message: str
    is_read: bool = False
    timestamp: datetime = Field(default_factory=utc_now)
