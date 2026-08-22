# MindAxis backend

FastAPI service with one real endpoint so far: a WebSocket that streams tokens
from a local Ollama model (via LangChain) for the chat companion. Everything
else (auth, database, appointments) is still frontend-only mock data — see
`PROJECT_CONTEXT.md` at the repo root for the full roadmap.

## Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # defaults are fine as-is
```

Make sure Ollama is running and the model is pulled before starting the server:

```bash
ollama serve            # if not already running
ollama pull qwen2.5-coder:3b
```

## Run

```bash
uvicorn app.main:app --reload
```

Check it's up: `curl http://localhost:8000/health` should return `{"status":"ok"}`.

## Connecting from the app

The frontend's WebSocket URL lives in `src/constants/config.ts` at the repo
root. `ws://localhost:8000/ws/chat` works for web and simulators/emulators, but
Expo Go on a physical phone can't reach `localhost` of your dev machine — swap
it for your machine's LAN IP (e.g. `ws://192.168.1.23:8000/ws/chat`) when
testing on a real device.

## Notes

- No auth is checked on the WebSocket yet — the frontend's anonymous session is
  still entirely mock, so there's no real token to verify. Don't treat this as
  access control.
- Conversation memory lives only in the WebSocket connection's process memory
  for as long as it's open — nothing is written to disk or a database. This
  matches the frontend, which doesn't persist chat messages either yet.
