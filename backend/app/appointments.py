from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Appointment
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/appointments", tags=["appointments"])

CAMPUS_COUNSELORS = [
    {
        "id": "c1",
        "name": "Dr. Ananya Sharma",
        "title": "Senior Clinical Psychologist",
        "specialty": "Academic Stress & Anxiety Management",
        "location": "Student Wellness Center, Room 204",
        "available_slots": ["10:00 AM - 10:45 AM", "02:00 PM - 02:45 PM", "04:00 PM - 04:45 PM"],
    },
    {
        "id": "c2",
        "name": "Prof. Rajesh Kumar",
        "title": "Student Wellness Counselor",
        "specialty": "Relationship & Social Guidance",
        "location": "Academic Block B, Room 102",
        "available_slots": ["11:00 AM - 11:45 AM", "03:00 PM - 03:45 PM"],
    },
    {
        "id": "c3",
        "name": "Dr. Priya Nair",
        "title": "Mental Health Specialist",
        "specialty": "Mindfulness & Personal Growth",
        "location": "Health & Counseling Wing, Room 308",
        "available_slots": ["09:30 AM - 10:15 AM", "01:30 PM - 02:15 PM"],
    },
]


class BookAppointmentBody(BaseModel):
    counselor_name: str
    counselor_title: str
    location: str
    appointment_date: str
    time_slot: str
    notes: str = ""


def _serialize(app: Appointment) -> dict:
    return {
        "id": str(app.id),
        "counselor_name": app.counselor_name,
        "counselor_title": getattr(app, "counselor_title", "Counselor"),
        "location": app.location,
        "appointment_date": getattr(app, "appointment_date", ""),
        "time_slot": getattr(app, "time_slot", ""),
        "notes": getattr(app, "notes", ""),
        "status": app.status,
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }


@router.get("/counselors")
def get_counselors():
    return CAMPUS_COUNSELORS


@router.get("")
def list_user_appointments(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(Appointment)
        .filter(Appointment.anonymous_id == anonymous_id)
        .order_by(Appointment.created_at.desc())
        .all()
    )
    return [_serialize(a) for a in apps]


@router.post("")
def book_appointment(
    body: BookAppointmentBody,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    app = Appointment(
        anonymous_id=anonymous_id,
        counselor_name=body.counselor_name,
        counselor_title=body.counselor_title,
        location=body.location,
        appointment_date=body.appointment_date,
        time_slot=body.time_slot,
        notes=body.notes,
        status="scheduled",
        created_at=datetime.now(timezone.utc),
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _serialize(app)


@router.put("/{appointment_id}/cancel")
@router.post("/{appointment_id}/cancel")
@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    app = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.anonymous_id == anonymous_id,
        )
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    app.status = "canceled"
    db.commit()
    db.refresh(app)
    return _serialize(app)

