from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Appointment, Counselor, CounselorSlot
from app.security import get_current_anonymous_id

router = APIRouter(prefix="/counselors", tags=["counselors"])
appointments_router = APIRouter(prefix="/appointments", tags=["appointments"])


# --- Schemas ---

class CounselorOut(BaseModel):
    id: int
    name: str
    title: str
    department: str
    location: str
    specialties: str
    bio: str
    avatar_color: str

    class Config:
        from_attributes = True


class SlotOut(BaseModel):
    id: int
    counselor_id: int
    slot_time: str
    is_booked: bool


class BookAppointmentRequest(BaseModel):
    counselor_id: int
    slot_id: int
    topic: str = ""


class AppointmentOut(BaseModel):
    id: int
    anonymous_id: str
    counselor_id: int
    counselor_name: str
    location: str
    slot_time: str
    topic: str
    status: str
    created_at: str


def _serialize_slot(slot: CounselorSlot) -> dict:
    return {
        "id": slot.id,
        "counselor_id": slot.counselor_id,
        "slot_time": slot.slot_time.isoformat(),
        "is_booked": slot.is_booked,
    }


def _serialize_appointment(apt: Appointment) -> dict:
    return {
        "id": apt.id,
        "anonymous_id": apt.anonymous_id,
        "counselor_id": apt.counselor_id,
        "counselor_name": apt.counselor_name,
        "location": apt.location,
        "slot_time": apt.slot_time.isoformat(),
        "topic": apt.topic,
        "status": apt.status,
        "created_at": apt.created_at.isoformat(),
    }


def _seed_counselors_and_slots_if_empty(db: Session) -> None:
    """Populates realistic college counseling staff & upcoming in-person slots if empty."""
    if db.query(Counselor).first():
        return

    counselors_data = [
        {
            "name": "Dr. Sunita Rao, Ph.D.",
            "title": "Lead Campus Psychologist",
            "department": "Student Well-being Center",
            "location": "Health & Wellness Block, Room 204",
            "specialties": "Academic Burnout, Anxiety, Identity, Crisis Support",
            "bio": "Over 12 years of experience supporting university students navigating high-stress academic environments.",
            "avatar_color": "#0058be",
        },
        {
            "name": "Dr. Rajesh Varma, MD",
            "title": "Senior Clinical Counselor",
            "department": "Department of Mental Health & Guidance",
            "location": "North Wing Clinic, Cabin 12",
            "specialties": "Depression, Sleep Optimization, Social Anxiety",
            "bio": "Specializes in cognitive behavioral approaches for young adults and transition-to-college challenges.",
            "avatar_color": "#1c7a4d",
        },
        {
            "name": "Ms. Neha Patel, M.Phil",
            "title": "Student Wellness Specialist",
            "department": "Student Affairs Guidance Unit",
            "location": "Central Library Annex, Counseling Suite A",
            "specialties": "Time Management, Relationship Stress, Mindfulness",
            "bio": "Warm, student-centered approach focusing on stress regulation and building personal resilience.",
            "avatar_color": "#8c4a00",
        },
    ]

    counselor_objs = []
    for c in counselors_data:
        obj = Counselor(**c)
        db.add(obj)
        counselor_objs.append(obj)
    db.commit()

    now = datetime.now(timezone.utc)
    base_date = now.replace(minute=0, second=0, microsecond=0)

    # Generate slots for upcoming 5 weekdays at 10:00, 11:30, 14:00, 15:30
    slot_hours = [(10, 0), (11, 30), (14, 0), (15, 30)]
    for c_obj in counselor_objs:
        for day_offset in range(1, 6):
            target_day = base_date + timedelta(days=day_offset)
            # Skip weekends (Saturday=5, Sunday=6)
            if target_day.weekday() >= 5:
                continue
            for hour, minute in slot_hours:
                slot_dt = target_day.replace(hour=hour, minute=minute)
                slot = CounselorSlot(
                    counselor_id=c_obj.id,
                    slot_time=slot_dt,
                    is_booked=False,
                )
                db.add(slot)
    db.commit()


# --- Counselor Endpoints ---

@router.get("")
def list_counselors(db: Session = Depends(get_db)):
    _seed_counselors_and_slots_if_empty(db)
    counselors = db.query(Counselor).order_by(Counselor.id.asc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "title": c.title,
            "department": c.department,
            "location": c.location,
            "specialties": c.specialties,
            "bio": c.bio,
            "avatar_color": c.avatar_color,
        }
        for c in counselors
    ]


@router.get("/{counselor_id}/slots")
def list_counselor_slots(counselor_id: int, db: Session = Depends(get_db)):
    _seed_counselors_and_slots_if_empty(db)
    now = datetime.now(timezone.utc)
    slots = (
        db.query(CounselorSlot)
        .filter(
            CounselorSlot.counselor_id == counselor_id,
            CounselorSlot.is_booked == False,
            CounselorSlot.slot_time >= now,
        )
        .order_by(CounselorSlot.slot_time.asc())
        .all()
    )
    return [_serialize_slot(s) for s in slots]


# --- Appointment Endpoints ---

@appointments_router.post("")
def book_appointment(
    body: BookAppointmentRequest,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    slot = (
        db.query(CounselorSlot)
        .filter(CounselorSlot.id == body.slot_id, CounselorSlot.counselor_id == body.counselor_id)
        .first()
    )
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time slot not found.")
    if slot.is_booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot has already been booked by another student.",
        )

    counselor = db.query(Counselor).filter(Counselor.id == body.counselor_id).first()
    if not counselor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counselor not found.")

    # Mark slot booked
    slot.is_booked = True

    # Create double-blind appointment
    appointment = Appointment(
        anonymous_id=anonymous_id,
        counselor_id=counselor.id,
        counselor_name=counselor.name,
        location=counselor.location,
        slot_time=slot.slot_time,
        topic=body.topic.strip(),
        status="scheduled",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return _serialize_appointment(appointment)


@appointments_router.get("")
def list_student_appointments(
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.anonymous_id == anonymous_id)
        .order_by(Appointment.slot_time.desc())
        .all()
    )
    return [_serialize_appointment(apt) for apt in appointments]


@appointments_router.post("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    anonymous_id: str = Depends(get_current_anonymous_id),
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.anonymous_id == anonymous_id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.status == "cancelled":
        return _serialize_appointment(appointment)

    appointment.status = "cancelled"

    # Free up the slot if it exists
    slot = (
        db.query(CounselorSlot)
        .filter(
            CounselorSlot.counselor_id == appointment.counselor_id,
            CounselorSlot.slot_time == appointment.slot_time,
        )
        .first()
    )
    if slot:
        slot.is_booked = False

    db.commit()
    db.refresh(appointment)
    return _serialize_appointment(appointment)
