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
```
src/app/_layout.tsx              — Root stack: (tabs) group, hidden screens
                                    (chat, assessment), modal (profile)
src/app/(tabs)/_layout.tsx       — Bottom tab navigator: Home, Sessions,
                                    Library, Settings
src/app/(tabs)/index.tsx         — Home screen (done) — routes to chat,
                                    assessment
src/app/chat.tsx                 — AI companion chat UI (done) —
                                    KeyboardAvoidingView, privacy trust badge,
                                    AI/user bubble differentiation, input state
src/app/assessment.tsx           — PHQ-9 daily check-in (done) — custom radio
                                    buttons, progress bar
```

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
1. Build `sessions.tsx`, `library.tsx` (placeholder), `settings.tsx`
2. Build `profile.tsx` modal
3. Add `CrisisBanner` component + `crisis-resources.tsx` stub screen
4. Initialize backend: `backend/` folder, Python venv, FastAPI skeleton,
   Uvicorn entrypoint
5. Build the WebSocket endpoint that streams tokens from local Ollama
   (via LangChain) to `chat.tsx`
6. Design the SQLAlchemy models with the double-blind separation in mind
   (identity table vs. session/clinical table, linked only via an anonymous
   session ID)

## Full Product Scope (Roadmap)
Noted 2026-08-22 for future reference — **not started**, do not begin building
against this until asked. Current work is still the mobile UI scaffold plus a
mock login flow (see "Current Codebase Status" above); nothing below exists yet.

**Mobile app**
- Login and registration
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
- Authentication
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
