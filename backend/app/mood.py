from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import MoodEntry
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/mood", tags=["mood"])

MoodLevel = Literal["great", "good", "okay", "low", "awful"]


class LogMoodBody(BaseModel):
    level: MoodLevel
    note: str = ""


def _serialize(entry: MoodEntry) -> dict:
    return {
        "id": str(entry.id),
        "level": entry.level,
        "note": entry.note,
        "logged_at": entry.logged_at.isoformat(),
    }


@router.post("")
def log_mood(
    body: LogMoodBody,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entry = MoodEntry(
        anonymous_id=anonymous_id,
        level=body.level,
        note=body.note,
        logged_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize(entry)


@router.get("")
def list_mood_entries(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(MoodEntry)
        .filter(MoodEntry.anonymous_id == anonymous_id)
        .order_by(MoodEntry.logged_at.desc())
        .all()
    )
    return [_serialize(entry) for entry in entries]
