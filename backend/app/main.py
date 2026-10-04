from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.appointments import router as appointments_router  # noqa: E402
from app.assessment import router as assessment_router  # noqa: E402  (after load_dotenv)
from app.auth import router as auth_router  # noqa: E402
from app.chat import router as chat_router  # noqa: E402
from app.db import Base, engine  # noqa: E402
from app.journal import router as journal_router  # noqa: E402
from app.mood import router as mood_router  # noqa: E402
from app.notifications import router as notifications_router  # noqa: E402
from app.models import (  # noqa: E402,F401
    Appointment,
    AssessmentResult,
    Counselor,
    CounselorSlot,
    JournalEntry,
    MoodEntry,
    NotificationPreference,
    Student,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="MindAxis backend", lifespan=lifespan)

# Local dev only — the Expo web dev server runs on a different port than
# this API, so plain HTTP requests (unlike the WebSocket chat endpoint) need
# CORS or the browser blocks them with a preflight 405.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(mood_router)
app.include_router(journal_router)
app.include_router(assessment_router)
app.include_router(notifications_router)
app.include_router(appointments_router)


@app.get("/health")
def health():
    return {"status": "ok"}



@app.get("/health")
def health():
    return {"status": "ok"}
