from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.database import get_session
from backend.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications Centre"])

@router.get("")
def list_notifications(
    channel: Optional[str] = None, # "IN_APP", "SMS", "EMAIL"
    session: Session = Depends(get_session)
):
    query = select(Notification)
    if channel:
        query = query.where(Notification.channel == channel)
    items = session.exec(query.order_by(Notification.timestamp.desc())).all()
    return items

@router.post("/{id}/read")
def mark_notification_read(id: int, session: Session = Depends(get_session)):
    notif = session.get(Notification, id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"status": "success", "id": id}

@router.post("/mark-all-read")
def mark_all_read(session: Session = Depends(get_session)):
    items = session.exec(select(Notification).where(Notification.is_read == False)).all()
    for it in items:
        it.is_read = True
        session.add(it)
    session.commit()
    return {"status": "success", "count": len(items)}
