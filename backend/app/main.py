from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from app.chat import router as chat_router  # noqa: E402  (after load_dotenv)

app = FastAPI(title="MindAxis backend")
app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}
