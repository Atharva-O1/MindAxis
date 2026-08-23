// Local backend URLs. Default is `localhost`, which is correct for anyone
// running the backend AND the Expo app on the same machine (web, simulator,
// or the standard "run your own full stack locally" workflow) — this is
// what every teammate gets out of the box, no setup needed.
//
// `localhost` does NOT work from Expo Go on a physical phone, since the
// phone's `localhost` means the phone itself, not your dev machine. If
// you're testing on a real device, override these in your own untracked
// `.env.local` at the repo root (never commit a teammate's personal IP into
// this file — it won't work on anyone else's network):
//
//   EXPO_PUBLIC_API_BASE_URL=http://<your-LAN-IP>:8000
//   EXPO_PUBLIC_CHAT_WS_URL=ws://<your-LAN-IP>:8000/ws/chat
//
// Find your LAN IP with `ipconfig` (Windows) or `ifconfig`/`ip a`
// (macOS/Linux). Restart `expo start` after changing `.env.local`.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
export const CHAT_WS_URL = process.env.EXPO_PUBLIC_CHAT_WS_URL ?? 'ws://localhost:8000/ws/chat';
