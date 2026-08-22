from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.auth import router as auth_router  # noqa: E402  (after load_dotenv)
from app.chat import router as chat_router  # noqa: E402
from app.db import Base, engine  # noqa: E402
from app.models import Student  # noqa: E402,F401  (registers the table with Base)


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


@app.get("/health")
def health():
    return {"status": "ok"}
