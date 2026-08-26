# MindAxis backend

FastAPI service with two real features so far:

1. A WebSocket that streams tokens from a local Ollama model (via LangChain)
   for the chat companion.
2. Real login/OTP auth (Postgres-backed): request a code, verify it, get a JWT.

Everything else (appointments, mood/journal/assessment records, other
clinical data) is still frontend-only mock data — see `PROJECT_CONTEXT.md` at
the repo root for the full roadmap.

**If you're a collaborator: cloning the repo does NOT give you a working
backend.** `.venv/`, `.env`, and the PostgreSQL database itself are all local
to whoever set them up — none of that is in git (deliberately: secrets and a
huge venv don't belong in version control). Everyone on the team who wants
the chat/login features working needs to run through the full **Setup**
section below on their own machine. Once you have, the frontend's default
config (`localhost`) talks to your own local backend automatically — no
shared server, no IP to coordinate as a team.

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
uvicorn app.main:app --reload --host 0.0.0.0
```

`--host 0.0.0.0` (rather than the default `127.0.0.1`-only bind) makes the
server reachable from other devices on your network, not just this machine
— needed for testing on a physical phone (see below). Harmless if you're
only ever testing on this machine.

Check it's up: `curl http://localhost:8000/health` should return `{"status":"ok"}`.

## Connecting from the app

The frontend's backend URLs (`src/constants/config.ts`) auto-detect the
right host at runtime instead of hardcoding one:

- **Web**: uses the browser's own hostname — always correct, whatever it is.
- **Native (Expo Go / dev client)**: uses `Constants.expoConfig.hostUri`,
  the same address the device already used to load the JS bundle from
  Metro. Since that connection already works, the backend (same machine,
  port 8000 instead of Metro's 8081) is reachable at that same host — no
  manual IP entry, and it keeps working automatically even after switching
  Wi-Fi networks.

This means physical-device testing just works as long as the backend was
started with `--host 0.0.0.0` (above). On Windows you may also need to
allow the port through the firewall the first time:
`New-NetFirewallRule -DisplayName "MindAxis backend" -Direction Inbound
-Protocol TCP -LocalPort 8000 -Action Allow` (run as Administrator) — the
project's `setup.ps1` does this for you.

An untracked `.env.local` at the repo root (`EXPO_PUBLIC_API_BASE_URL`,
`EXPO_PUBLIC_CHAT_WS_URL`) still works as an override for edge cases — e.g.
the backend running on a different machine than the one serving the app —
but shouldn't be needed for the normal case anymore. Don't hardcode an IP
into it if you do use it: IPs change across networks, and a hardcoded one
will silently stop working the next time you switch Wi-Fi.

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
