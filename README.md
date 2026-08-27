# MindAxis

A privacy-first, double-blind mental health triage and AI companion app —
a college database/systems project. See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
for architecture, design tokens, and scope decisions.

## Get started

**New machine / new teammate?** Run `setup.bat` (double-click it, or run
`setup.ps1` in PowerShell) — it installs everything needed (Git, Node,
Python, PostgreSQL, Ollama) and sets up the project end to end. See
`backend/README.md` if you'd rather do it by hand, or if something in the
script needs troubleshooting.

Once set up, day to day:

```bash
npm start
```

(the backend needs to be running separately too — see `backend/README.md`
for the three-terminal setup: Ollama, the FastAPI backend, and the app).

This project uses [Expo Router](https://docs.expo.dev/router/introduction) with
file-based routing under `src/app`.

## Structure

```
src/app/_layout.tsx              Root stack: (tabs) group, hidden screens
                                  (chat, assessment, crisis-resources), profile modal
src/app/(tabs)/_layout.tsx        Bottom tab navigator: Home, Sessions, Library, Settings
src/app/(tabs)/index.tsx          Home — routes to chat, assessment
src/app/(tabs)/sessions.tsx       Past chat sessions (mock data)
src/app/(tabs)/library.tsx        Placeholder (on hold)
src/app/(tabs)/settings.tsx       Preferences + anonymous session section
src/app/chat.tsx                  AI companion chat UI
src/app/assessment.tsx            PHQ-9 daily check-in
src/app/profile.tsx               Anonymous profile modal
src/app/crisis-resources.tsx      Indian crisis helpline numbers
src/components/CrisisBanner.tsx   Reusable always-visible crisis banner
src/constants/theme.ts            Fixed design tokens (colors, spacing, radius, type)
src/data/mockSessions.ts          Mock session data
```

Backend (`backend/` — FastAPI + PostgreSQL + local Ollama via LangChain) has
real login/OTP auth and a real streaming AI chat endpoint. See
`backend/README.md` and `PROJECT_CONTEXT.md` for what's built vs. still mock.

Frontend (mobile app):

React Native 0.86 + React 19, via Expo SDK 57
Expo Router (file-based navigation)
Plain React Native StyleSheet — no Tailwind/CSS libraries
react-native-reanimated for animations (screen transitions, mood-tracker bounces, chat bubble entrances)
expo-linear-gradient for the gradient accents
@expo/vector-icons (MaterialIcons) for icons
@react-native-async-storage/async-storage — local persistence for auth session, mood entries, journal entries, assessment results (survives app reload/restart)
TypeScript throughout


Backend

Python + FastAPI (HTTP + WebSocket routing)
Uvicorn (ASGI server)
SQLAlchemy 2.0 (ORM)
bcrypt for OTP hashing (not passlib — turned out to be unmaintained/broken on current Python)
PyJWT for session tokens
python-dotenv for config


AI

Ollama, running qwen2.5-coder:3b locally (no cloud calls)
LangChain (langchain-ollama) for the streaming chat integration and persona/system-prompt handling


Database

PostgreSQL — one table so far (students: email + anonymous ID + hashed OTP), holding only identity data per the double-blind design


Infra/tooling

winget-based setup scripts (setup.ps1/setup.bat) for one-shot environment provisioning
Git/GitHub for version control and team collaboration
