import os
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Student

router = APIRouter(prefix="/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

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


def _create_jwt(anonymous_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": anonymous_id, "iat": now, "exp": now + timedelta(days=JWT_EXPIRY_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


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

    # Dev-only delivery stand-in — no email sending is configured. A real
    # deployment would send this over email instead of printing it.
    print(f"[auth] OTP for {email}: {code}")

    return {"message": "Code sent."}


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

    token = _create_jwt(student.anonymous_id)
    return {"token": token, "anonymous_id": student.anonymous_id}
