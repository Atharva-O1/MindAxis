from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import NotificationPreference
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationPreferenceUpdate(BaseModel):
    enabled: bool
    daily_reminder_enabled: bool
    reminder_time: str = "20:00"


def _serialize(pref: NotificationPreference) -> dict:
    return {
        "enabled": pref.enabled,
        "daily_reminder_enabled": pref.daily_reminder_enabled,
        "reminder_time": pref.reminder_time,
        "updated_at": pref.updated_at.isoformat() if pref.updated_at else None,
    }


@router.get("/settings")
def get_notification_settings(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    pref = (
        db.query(NotificationPreference)
        .filter(NotificationPreference.anonymous_id == anonymous_id)
        .first()
    )
    if not pref:
        pref = NotificationPreference(
            anonymous_id=anonymous_id,
            enabled=True,
            daily_reminder_enabled=True,
            reminder_time="20:00",
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return _serialize(pref)


@router.put("/settings")
def update_notification_settings(
    body: NotificationPreferenceUpdate,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    pref = (
        db.query(NotificationPreference)
        .filter(NotificationPreference.anonymous_id == anonymous_id)
        .first()
    )
    if not pref:
        pref = NotificationPreference(
            anonymous_id=anonymous_id,
            enabled=body.enabled,
            daily_reminder_enabled=body.daily_reminder_enabled,
            reminder_time=body.reminder_time,
        )
        db.add(pref)
    else:
        pref.enabled = body.enabled
        pref.daily_reminder_enabled = body.daily_reminder_enabled
        pref.reminder_time = body.reminder_time

    db.commit()
    db.refresh(pref)
    return _serialize(pref)
