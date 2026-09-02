"""JWT creation and verification, shared by every router that needs to know
who's calling (anything touching a student's own mood/journal/assessment
data). Encode and decode both live here so the scheme stays in one place.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

_bearer_scheme = HTTPBearer()


def create_jwt(anonymous_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": anonymous_id, "iat": now, "exp": now + timedelta(days=JWT_EXPIRY_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_anonymous_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session. Please log in again.")

    anonymous_id = payload.get("sub")
    if not anonymous_id:
        raise HTTPException(status_code=401, detail="Invalid session. Please log in again.")
    return anonymous_id
