import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Student(Base):
    """Identity-side table only.

    `anonymous_id` is the ONLY thing that should ever leave this table and
    reach any other part of the system (JWTs, future clinical/session
    tables). `email` never does — that's the double-blind separation from
    PROJECT_CONTEXT.md, enforced by discipline in the API layer since there's
    no other table to join against yet.
    """

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    anonymous_id: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4())
    )

    otp_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    otp_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# Clinical/session-side tables below. Each has a plain `anonymous_id` column —
# deliberately NOT a SQLAlchemy ForeignKey to students.id — so there's no
# direct DB-level join path from a student's real identity to their mood,
# journal, or assessment data. Same double-blind reasoning as Student above.


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    anonymous_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str] = mapped_column(String, default="", nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    anonymous_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String, default="", nullable=False)
    body: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    anonymous_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
