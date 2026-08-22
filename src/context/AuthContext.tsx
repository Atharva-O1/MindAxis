import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { loadJSON, removeJSON, saveJSON } from '@/lib/storage';

// Real backend auth: email -> OTP (verified server-side, Postgres-backed) ->
// JWT. The email only ever proves college affiliation during sign-in; the
// backend mints/reuses an anonymous ID and that's the only thing this app
// (or its JWT) ever carries afterward. See backend/app/auth.py.
const SESSION_KEY = 'mindaxis.auth.session';

type AuthStatus = 'signedOut' | 'awaitingOtp' | 'signedIn';

type AuthResult = { success: boolean; error?: string };

type StoredSession = { token: string; anonymousId: string };

type AuthContextValue = {
  status: AuthStatus;
  isHydrating: boolean;
  pendingEmail: string | null;
  anonymousId: string | null;
  requestOtp: (email: string) => Promise<AuthResult>;
  verifyOtp: (code: string) => Promise<AuthResult>;
  resetToEmailStep: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NETWORK_ERROR = 'Could not reach the server. Is the backend running?';

// No crypto needed — just reading the `exp` claim to proactively sign out an
// obviously-expired session, rather than trusting a stale one until some
// future protected endpoint rejects it (nothing checks the JWT yet).
function isJwtExpired(token: string): boolean {
  try {
    const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'function') return false;
    const payload = JSON.parse(atob(payloadB64));
    if (typeof payload.exp !== 'number') return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { detail: NETWORK_ERROR } };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('signedOut');
  const [isHydrating, setIsHydrating] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<StoredSession>(SESSION_KEY)
      .then((session) => {
        if (!session || isJwtExpired(session.token)) return;
        setAnonymousId(session.anonymousId);
        setStatus('signedIn');
      })
      .finally(() => setIsHydrating(false));
  }, []);

  async function requestOtp(email: string): Promise<AuthResult> {
    const { ok, data } = await postJson('/auth/request-otp', { email });
    if (!ok) return { success: false, error: data.detail ?? NETWORK_ERROR };
    setPendingEmail(email);
    setStatus('awaitingOtp');
    return { success: true };
  }

  async function verifyOtp(code: string): Promise<AuthResult> {
    if (!pendingEmail) return { success: false, error: 'Missing email — go back and try again.' };
    const { ok, data } = await postJson('/auth/verify-otp', { email: pendingEmail, code });
    if (!ok) return { success: false, error: data.detail ?? NETWORK_ERROR };

    setAnonymousId(data.anonymous_id);
    setStatus('signedIn');
    saveJSON(SESSION_KEY, { token: data.token, anonymousId: data.anonymous_id });
    return { success: true };
  }

  function resetToEmailStep() {
    setPendingEmail(null);
    setStatus('signedOut');
  }

  function logout() {
    setPendingEmail(null);
    setAnonymousId(null);
    setStatus('signedOut');
    removeJSON(SESSION_KEY);
  }

  const value = useMemo(
    () => ({
      status,
      isHydrating,
      pendingEmail,
      anonymousId,
      requestOtp,
      verifyOtp,
      resetToEmailStep,
      logout,
    }),
    [status, isHydrating, pendingEmail, anonymousId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
