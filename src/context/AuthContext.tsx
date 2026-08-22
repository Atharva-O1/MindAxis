import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { loadJSON, removeJSON, saveJSON } from '@/lib/storage';

// Mock auth — no backend yet. Email is used only to prove college affiliation
// during sign-in; once verified we mint a throwaway anonymous session ID and
// discard the email. This keeps the "double-blind" separation even in the
// UI layer: nothing downstream (chat, assessment, sessions) ever sees the email.
const MOCK_OTP_CODE = '123456';

// Only the anonymous ID is persisted — never the email, and never the
// mid-verification "awaitingOtp" step, so a killed app never resumes holding
// identity data at rest. Stored via AsyncStorage rather than SecureStore: the
// value itself carries no PII (no email, no real credential), just a random
// local ID, so plain local storage is enough.
const SESSION_KEY = 'mindaxis.auth.session';

type AuthStatus = 'signedOut' | 'awaitingOtp' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  isHydrating: boolean;
  pendingEmail: string | null;
  anonymousId: string | null;
  requestOtp: (email: string) => void;
  verifyOtp: (code: string) => boolean;
  resetToEmailStep: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function generateAnonymousId() {
  return `anon-${Math.random().toString(16).slice(2, 10)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('signedOut');
  const [isHydrating, setIsHydrating] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    loadJSON<{ anonymousId: string }>(SESSION_KEY)
      .then((session) => {
        if (!session) return;
        setAnonymousId(session.anonymousId);
        setStatus('signedIn');
      })
      .finally(() => setIsHydrating(false));
  }, []);

  function requestOtp(email: string) {
    setPendingEmail(email);
    setStatus('awaitingOtp');
  }

  function verifyOtp(code: string) {
    if (code !== MOCK_OTP_CODE) return false;
    const id = generateAnonymousId();
    setAnonymousId(id);
    setStatus('signedIn');
    saveJSON(SESSION_KEY, { anonymousId: id });
    return true;
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

export const DEV_MOCK_OTP_CODE = MOCK_OTP_CODE;
