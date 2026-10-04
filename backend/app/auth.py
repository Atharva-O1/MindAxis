import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.email_service import send_otp_email
from app.models import Student
import os
from app.security import create_counselor_jwt, create_jwt

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class RequestOtpBody(BaseModel):
    email: str


class VerifyOtpBody(BaseModel):
    email: str
    code: str


def _generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))


@router.post("/request-otp")
def request_otp(body: RequestOtpBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")

    student = db.query(Student).filter(Student.email == email).first()
    if student is None:
        student = Student(email=email)
        db.add(student)

    code = _generate_otp()
    student.otp_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
    student.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    student.otp_attempts = 0
    db.commit()

    # Send real email via SMTP if configured, or print to console fallback
    send_otp_email(to_email=email, code=code)

    return {"message": "Verification code sent to your email."}


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    student = db.query(Student).filter(Student.email == email).first()

    if student is None or student.otp_hash is None or student.otp_expires_at is None:
        raise HTTPException(status_code=400, detail="Request a new code first.")

    if datetime.now(timezone.utc) > student.otp_expires_at:
        raise HTTPException(status_code=400, detail="Code expired. Request a new one.")

    if student.otp_attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new code.")

    if not bcrypt.checkpw(body.code.encode(), student.otp_hash.encode()):
        student.otp_attempts += 1
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - student.otp_attempts
        raise HTTPException(status_code=401, detail=f"Incorrect code. {remaining} attempt(s) left.")

    student.otp_hash = None
    student.otp_expires_at = None
    student.otp_attempts = 0
    db.commit()

    token = create_jwt(student.anonymous_id)
    return {"token": token, "anonymous_id": student.anonymous_id}


class CounselorLoginBody(BaseModel):
    counselor_name: str
    counselor_key: str


COUNSELOR_ACCESS_KEY = os.getenv("COUNSELOR_ACCESS_KEY", "COUNSELOR2026")


@router.post("/counselor-login")
def counselor_login(body: CounselorLoginBody):
    key = body.counselor_key.strip()
    if key != COUNSELOR_ACCESS_KEY:
        raise HTTPException(status_code=401, detail="Invalid Counselor Access Key.")

    counselor_name = body.counselor_name.strip()
    if not counselor_name:
        raise HTTPException(status_code=400, detail="Counselor name is required.")

    token = create_counselor_jwt(counselor_name)
    return {
        "token": token,
        "counselor_name": counselor_name,
        "role": "counselor",
    }

