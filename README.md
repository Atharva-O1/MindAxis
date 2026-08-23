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
