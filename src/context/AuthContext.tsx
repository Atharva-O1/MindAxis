import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

// Mock auth — no backend yet. Email is used only to prove college affiliation
// during sign-in; once verified we mint a throwaway anonymous session ID and
// discard the email. This keeps the "double-blind" separation even in the
// UI layer: nothing downstream (chat, assessment, sessions) ever sees the email.
const MOCK_OTP_CODE = '123456';

type AuthStatus = 'signedOut' | 'awaitingOtp' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
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
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  function requestOtp(email: string) {
    setPendingEmail(email);
    setStatus('awaitingOtp');
  }

  function verifyOtp(code: string) {
    if (code !== MOCK_OTP_CODE) return false;
    setAnonymousId(generateAnonymousId());
    setStatus('signedIn');
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
  }

  const value = useMemo(
    () => ({ status, pendingEmail, anonymousId, requestOtp, verifyOtp, resetToEmailStep, logout }),
    [status, pendingEmail, anonymousId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export const DEV_MOCK_OTP_CODE = MOCK_OTP_CODE;
