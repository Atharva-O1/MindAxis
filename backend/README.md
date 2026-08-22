# MindAxis backend

FastAPI service with two real features so far:

1. A WebSocket that streams tokens from a local Ollama model (via LangChain)
   for the chat companion.
2. Real login/OTP auth (Postgres-backed): request a code, verify it, get a JWT.

Everything else (appointments, mood/journal/assessment records, other
clinical data) is still frontend-only mock data — see `PROJECT_CONTEXT.md` at
the repo root for the full roadmap.

## Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

### Database

Needs a local PostgreSQL server. On Windows this project used:

```powershell
winget install --id PostgreSQL.PostgreSQL.18 -e
```

Then create a dedicated role + database (don't use the `postgres` superuser
for the app itself):

```sql
CREATE ROLE mindaxis WITH LOGIN PASSWORD 'choose-a-password';
CREATE DATABASE mindaxis OWNER mindaxis;
```

Set `DATABASE_URL` in `.env` to match:
`postgresql+psycopg://mindaxis:choose-a-password@localhost:5432/mindaxis`

Tables are created automatically on startup (`Base.metadata.create_all` in
`app/main.py`) — no migrations yet, since there's currently only one table.

Also set `JWT_SECRET` in `.env` to a random value, e.g.:
`python -c "import secrets; print(secrets.token_hex(32))"`

### AI model

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

The frontend's backend URLs live in `src/constants/config.ts` at the repo
root (`API_BASE_URL` and `CHAT_WS_URL`). `localhost` works for web and
simulators/emulators, but Expo Go on a physical phone can't reach `localhost`
of your dev machine — swap both for your machine's LAN IP (e.g.
`192.168.1.23`) when testing on a real device.

## Notes

- **OTP delivery is stubbed** — no email sending is configured, so
  `POST /auth/request-otp` prints the generated code to this server's own
  console instead of emailing it. Real OTP generation, bcrypt hashing,
  10-minute expiry, and a 5-attempt lockout are all real; only the delivery
  channel is a placeholder.
- **Double-blind separation**: the `students` table (`app/models.py`) is the
  *only* place an email is ever stored, and the *only* place the
  email↔anonymous-ID mapping exists. The JWT only ever carries the
  anonymous ID (`sub` claim) — nothing downstream (chat, and later
  mood/journal/assessment data) ever sees the email.
- **No auth is checked on the chat WebSocket yet** — a JWT is issued on
  login, but nothing currently verifies it on any endpoint. Wiring auth onto
  chat (and future endpoints) is a natural next step, not done yet.
- Conversation memory for chat lives only in that WebSocket connection's
  process memory for as long as it's open — nothing is written to disk or
  the database.
