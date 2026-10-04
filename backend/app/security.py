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


class InvalidToken(Exception):
    """Raised by decode_jwt so non-HTTP callers (the chat WebSocket, which
    can't rely on FastAPI's HTTPException/Depends flow) can catch it too."""


def create_jwt(anonymous_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": anonymous_id, "iat": now, "exp": now + timedelta(days=JWT_EXPIRY_DAYS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> str:
    """Decode+validate a raw JWT string and return its anonymous_id, or raise
    InvalidToken. Shared by the HTTP dependency below and by the chat
    WebSocket route, which authenticates via a `?token=` query param instead
    of an Authorization header (browsers can't set custom WebSocket headers).
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise InvalidToken("Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise InvalidToken("Invalid session. Please log in again.")

    anonymous_id = payload.get("sub")
    if not anonymous_id:
        raise InvalidToken("Invalid session. Please log in again.")
    return anonymous_id


def get_current_anonymous_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    try:
        return decode_jwt(credentials.credentials)
    except InvalidToken as exc:
        raise HTTPException(status_code=401, detail=str(exc))
