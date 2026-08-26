# MindAxis — Project Context for Claude Code

## What This Is
A **college database/systems project** demonstrating a privacy-first, double-blind
mental health triage and AI companion app architecture. This is an academic
demonstration of system design (anonymous auth, real-time streaming, local LLM
inference, data isolation) — **not** a clinical product for real patients. Scope
decisions should favor "correct and well-architected" over "production-hardened
for liability," unless stated otherwise.

**Audience/region:** Indian college context. Use India-specific conventions
(helpline numbers, etc.) where relevant.

## Core Concept: "Double-Blind" Architecture
Identity data and clinical/session data must be architecturally separated —
even someone with backend/DB access shouldn't be able to trivially join a
user's real identity to their chat transcripts or PHQ-9 scores. This is
achieved via:
- Anonymous/pseudonymous user IDs (no PII stored alongside clinical data)
- Zero-identity JWTs (PyJWT) — tokens authenticate a session, not a person
- Separate data stores/tables for identity vs. clinical content, ideally with
  no foreign key that directly links the two without an intermediary

Every schema and endpoint design decision should be checked against this
principle before implementation.

## Tech Stack

**Frontend (Mobile Client)**
- React Native + Expo (SDK 57)
- Expo Router (file-based routing)
- Strict React Native `StyleSheet` — no Tailwind, no HTML
- `@expo/vector-icons` (MaterialIcons) for icons
- Node.js/npm + Metro bundler (localhost:8081)

**Backend & API Gateway**
- Python 3, isolated `.venv`
- FastAPI (HTTP routing)
- Uvicorn (ASGI server)
- WebSockets (token-by-token streaming for chat)
- PyJWT + passlib (anonymous session auth)

**AI Engine (local & offline — no cloud calls)**
- Ollama (local inference)
- Qwen2.5-coder or other quantized model (must run within ~6GB VRAM)
- LangChain (conversation memory, context buffering, persona prompting)

**Database**
- PostgreSQL
- SQLAlchemy ORM

**Dev environment**
- Git Bash (MINGW64) on Windows
- VS Code

## UI/UX Design System
- **Vibe:** calming, clinical-but-friendly, secure
- **Colors:**
  - Background surface-bright: `#F8F9FF`
  - Background surface-container-low: `#eff4ff`
  - Primary brand: `#0058be`
  - Text dark: `#121c2a`
  - Text muted: `#424754`
- All new screens must reuse these tokens — don't introduce new colors
  without a reason.

## Current Codebase Status
All mobile-app roadmap items are built except counselor appointments (not
started — offline/in-person only per the note below). Everything is
frontend-only: no backend, no real AI, mock/local data throughout.

```
src/app/_layout.tsx          — Root stack: login/verify-otp/(tabs) gated by
                                Stack.Protected on AuthContext.status, plus
                                hidden screens (chat, assessment, gad7,
                                mood-tracker, journal, journal-entry,
                                resource-detail), profile modal,
                                crisis-resources (always reachable)
src/app/(tabs)/_layout.tsx   — Bottom tabs: Home, Sessions, Library, Settings
src/app/(tabs)/index.tsx    — Home/Dashboard — mood week-strip + today's
                                mood, PHQ-9/GAD-7 tiles (show latest score
                                once taken), chat CTA, journal shortcut
src/app/login.tsx            — College email entry
src/app/verify-otp.tsx       — 6-digit OTP (demo code 123456, no real backend)
src/app/chat.tsx             — Chat UI; replies are keyword-matched mock
                                text (src/lib/mockChatReplies.ts), not a
                                real model yet
src/components/Questionnaire.tsx — Shared PHQ-9/GAD-7 flow; saves results
                                via AssessmentContext
src/app/mood-tracker.tsx, journal.tsx, journal-entry.tsx,
src/app/(tabs)/library.tsx   — Mood tracking, journal, resources (built
                                2026-08-22, hold lifted on Library)
```

**Persistence:** Auth session, mood entries, journal entries, and
assessment results are all persisted locally via AsyncStorage
(`src/lib/storage.ts` + per-feature contexts) — survives an app
reload/restart. This is local-device-only, not a real backend; it's a
stand-in until the FastAPI/Postgres layer exists. `expo-secure-store` was
tried for the auth session but its web implementation is a non-functional
stub, and the value being stored (a random anonymous ID, no PII) doesn't
need Keychain/Keystore-grade protection anyway — switched to AsyncStorage
for consistency and because it's actually verifiable cross-platform.

## Screen-Specific Decisions Already Made

**Sessions tab** (`src/app/(tabs)/sessions.tsx`)
- Lists **past chat conversations** (not scheduled appointments, not
  assessment history — just chat sessions)
- Sensitive content: don't render message-content previews on the list item
  itself — timestamps + light metadata (e.g. mood tag) only
- Use mock/dummy data array for now; structure it so it's a trivial swap to a
  real `/sessions` fetch later

**Library tab** (`src/app/(tabs)/library.tsx`)
- **Hold lifted 2026-08-22.** Now the Resources feature: static, hand-written
  wellness content grouped by category (Breathing & Grounding, Managing
  Stress, Sleep & Rest, Support) in `src/data/resources.ts`, with a detail
  screen (`resource-detail.tsx`). The "Support" category links out to
  `crisis-resources.tsx`. Content is illustrative/mock — not sourced from a
  real counselor or clinical review.

**Settings tab** (`src/app/(tabs)/settings.tsx`)
- Standard preferences + anonymous session/account section

**Crisis handling**
- No escalation logic, no human-in-the-loop — informational only, matching
  the "college project" scope
- Still include a lightweight, always-visible `CrisisBanner` component and a
  stub `crisis-resources.tsx` screen with Indian helpline numbers (Kiran
  1800-599-0019, iCall, AASRA) — cheap to add, good practice, reusable from
  chat/assessment/settings
- PHQ-9 item 9 (self-harm ideation) doesn't need special interrupt-flow logic
  for this scope — keep the assessment screen as-is unless asked

**Profile modal** (`src/app/profile.tsx`)
- Simple modal view, consistent styling with the rest of the app

## Immediate Next Steps (in order)
1. ~~Build `sessions.tsx`, `library.tsx` (placeholder), `settings.tsx`~~ done
2. ~~Build `profile.tsx` modal~~ done
3. ~~Add `CrisisBanner` component + `crisis-resources.tsx` stub screen~~ done
4. ~~Initialize backend: `backend/` folder, Python venv, FastAPI skeleton,
   Uvicorn entrypoint~~ done 2026-08-22
5. ~~Build the WebSocket endpoint that streams tokens from local Ollama
   (via LangChain) to `chat.tsx`~~ done 2026-08-22 — real streaming, no
   fallback to mock; see "Backend (built 2026-08-22)" below
6. ~~Design the SQLAlchemy models with the double-blind separation in mind~~
   done 2026-08-22 for the identity side (`students` table); a clinical/
   session table doesn't exist yet since mood/journal/assessments still
   live in AsyncStorage, not the database
7. **Next up:** move mood/journal/assessment data from AsyncStorage into
   real backend endpoints + a clinical-side table, and/or enforce the JWT on
   the chat WebSocket (currently issued but unchecked everywhere)

## Backend (built 2026-08-22)
`backend/` — FastAPI + LangChain + Ollama, one real endpoint:
`ws://localhost:8000/ws/chat`, streaming tokens from `qwen2.5-coder:3b`
(chosen over `qwen3.5:latest` for its ~1.9GB VRAM footprint vs. 6.6GB,
despite being code-specialized rather than general-purpose). See
`backend/README.md` for setup/run instructions.

- **Persona** (`backend/app/persona.py`): "Aria," a reflective-listening
  wellness companion — warm, short replies, explicitly told never to write
  code or claim to be a therapist. **Known limitation, tested 2026-08-22:**
  this is a soft system-prompt guardrail, not enforced. When directly asked
  to write code, the model complied fully (wrote real Python), ignoring the
  instruction — a real tradeoff of the code-specialized model. Multi-turn
  memory (recalling name/context across turns) works well otherwise.
- **Memory**: scoped to a single WebSocket connection only (a plain message
  list in that coroutine) — no session IDs, no persistence. Closing the
  connection (reload, app restart) discards the conversation, same as the
  frontend already did before this.
- **Auth**: none on the WebSocket. The frontend's anonymous session is still
  entirely mock (see `AuthContext.tsx`), so there's no real token to verify
  yet — don't treat this endpoint as access-controlled.
- **Frontend wiring**: `chat.tsx` now streams real tokens into the AI bubble
  progressively via `src/constants/config.ts`'s `CHAT_WS_URL`.
  `config.ts` auto-detects the right host at runtime (browser hostname on
  web; `Constants.expoConfig.hostUri` on native, the same address the
  device already used to load the JS bundle) rather than hardcoding
  `localhost` or an IP — that was tried first and broke for teammates
  whenever their machine's LAN IP changed networks. Backend must be started
  with `--host 0.0.0.0` for this to reach a physical device.
  `src/lib/mockChatReplies.ts` is no longer used by `chat.tsx` but was left
  in place, unused.

## Auth: real login/OTP (built 2026-08-22)
PostgreSQL (installed locally via `winget install PostgreSQL.PostgreSQL.18`)
+ SQLAlchemy 2.0 + `bcrypt` + `PyJWT`. Two endpoints in `backend/app/auth.py`:
`POST /auth/request-otp` and `POST /auth/verify-otp`. See `backend/README.md`
for full setup (role/database creation, env vars).

- **Schema** (`backend/app/models.py`): one table, `students` — id, email
  (unique), `anonymous_id` (UUID4, assigned once per email on first login,
  stable across repeat logins), `otp_hash`/`otp_expires_at`/`otp_attempts`.
  This is the *only* place email and `anonymous_id` are ever linked —
  double-blind principle enforced by never letting the email leave this
  table (the JWT only carries `anonymous_id` as its `sub` claim).
- **OTP**: real 6-digit code, bcrypt-hashed at rest, 10-minute expiry,
  locked out after 5 wrong attempts (requires a fresh `request-otp`).
  Delivery is stubbed — no email sending is configured, so the plaintext
  code is printed to the backend's own console instead (chosen over
  returning it in the API response, to keep the response contract
  production-shaped even though delivery isn't wired up).
- **`passlib`** (named in the original tech-stack list above) turned out to
  be effectively abandoned — breaks under Python 3.11+'s removed `crypt`
  module. Used `bcrypt` directly instead.
- **JWT**: HS256, `PyJWT`, ~30-day expiry, secret from `backend/.env`'s
  `JWT_SECRET` (gitignored, generated locally — not committed).
- **Not done**: nothing checks this JWT on any endpoint yet (chat included)
  — it's issued but not yet enforced anywhere. That's the natural next step,
  not part of this slice.
- **Frontend wiring**: `AuthContext.tsx`'s `requestOtp`/`verifyOtp` are now
  `async` and call the real endpoints via `fetch` (`API_BASE_URL` in
  `src/constants/config.ts`); `login.tsx`/`verify-otp.tsx` show loading
  states and surface real server error messages (wrong-code-with-attempts-
  remaining, expired, locked-out, network-unreachable) instead of one
  generic message. The old fixed mock code (`123456`) and
  `DEV_MOCK_OTP_CODE` export are gone — the OTP is real and random now.
  CORS middleware (`allow_origins=["*"]`, local dev only) was added to
  `backend/app/main.py` because plain HTTP POST from the browser needs it
  (unlike the WebSocket, which doesn't hit the same preflight mechanism).

## Full Product Scope (Roadmap)
Noted 2026-08-22 for future reference — **not started**, do not begin building
against this until asked. Current work is still the mobile UI scaffold plus a
mock login flow (see "Current Codebase Status" above); nothing below exists yet.

**Mobile app**
- Login and registration (built — real backend OTP auth now; see "Auth" below)
- Dashboard
- Mood tracking
- PHQ-9 and GAD-7 assessments (both built — share a `Questionnaire` component)
- Journal (built — list + compose/edit, `src/context/JournalContext.tsx`)
- AI wellness assistant
- Counselor appointments — **offline/in-person only**, scheduled with actual
  college staff. The app books a slot/time with a named counselor; it does
  not do video calls, chat-based counseling, or any remote session. UI should
  reflect this (e.g. show location/room, not a "join call" action).
- Resources (built — see "Library tab" below; content is mock/illustrative)
- Settings and privacy controls

**Backend server**
- Authentication (built — real OTP/JWT; see "Auth" section above)
- Student profiles
- Mood records
- Assessments
- Journals
- Appointments
- AI chat requests
- Notifications
- Database access

**Database and AI**
- PostgreSQL for application data
- Ollama for the local AI model
- FastAPI connecting the mobile app to the database and AI engine
- Firebase, later, for push notifications

## Recommended Learning Order
Build (and learn) in this order — explicitly **do not start with AI or
appointments**:
1. Basic programming concepts
2. React Native user interfaces
3. Navigation between screens
4. Forms and input validation
5. Local app state
6. Backend APIs
7. Database operations
8. Authentication
9. AI integration
10. Notifications and deployment

## Working Conventions
- Match existing file structure and styling patterns already in the repo —
  don't introduce new patterns (e.g. don't add Tailwind, don't restructure
  routing) without discussion
- Mock data over premature backend integration until the FastAPI server
  exists
- Flag (but don't block on) any design choice that would compromise the
  double-blind property
