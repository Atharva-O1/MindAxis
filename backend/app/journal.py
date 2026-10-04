from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import JournalEntry
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/journal", tags=["journal"])


class JournalBody(BaseModel):
    title: str = ""
    body: str


def _serialize(entry: JournalEntry) -> dict:
    return {
        "id": str(entry.id),
        "title": entry.title,
        "body": entry.body,
        "updated_at": entry.updated_at.isoformat(),
    }


def _get_owned_entry(db: Session, anonymous_id: str, entry_id: int) -> JournalEntry:
    entry = (
        db.query(JournalEntry)
        .filter(JournalEntry.id == entry_id, JournalEntry.anonymous_id == anonymous_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found.")
    return entry


@router.get("")
def list_entries(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.anonymous_id == anonymous_id)
        .order_by(JournalEntry.updated_at.desc())
        .all()
    )
    return [_serialize(entry) for entry in entries]


@router.post("")
def create_entry(
    body: JournalBody,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entry = JournalEntry(anonymous_id=anonymous_id, title=body.title, body=body.body)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _serialize(entry)


@router.put("/{entry_id}")
def update_entry(
    entry_id: int,
    body: JournalBody,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entry = _get_owned_entry(db, anonymous_id, entry_id)
    entry.title = body.title
    entry.body = body.body
    entry.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(entry)
    return _serialize(entry)


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    entry = _get_owned_entry(db, anonymous_id, entry_id)
    db.delete(entry)
    db.commit()
    return {"ok": True}
