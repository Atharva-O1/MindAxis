import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { MoodLevel } from '@/constants/moods';
import { useAuth } from '@/context/AuthContext';

export type MoodEntry = {
  id: string;
  level: MoodLevel;
  note: string;
  loggedAt: string;
};

type LogMoodResult = { success: boolean; error?: string };

type MoodContextValue = {
  entries: MoodEntry[];
  isLoading: boolean;
  logMood: (level: MoodLevel, note?: string) => Promise<LogMoodResult>;
  todaysEntry: MoodEntry | null;
};

const MoodContext = createContext<MoodContextValue | null>(null);

const NETWORK_ERROR = 'Could not reach the server. Is the backend running?';

function isSameDay(isoA: string, isoB: string) {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

function fromApi(raw: any): MoodEntry {
  return { id: raw.id, level: raw.level, note: raw.note, loggedAt: raw.logged_at };
}

export function MoodProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn' || !token) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    fetch(`${API_BASE_URL}/mood`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEntries(data.map(fromApi)))
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, [status, token]);

  async function logMood(level: MoodLevel, note = ''): Promise<LogMoodResult> {
    if (!token) return { success: false, error: 'Not signed in.' };
    try {
      const res = await fetch(`${API_BASE_URL}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ level, note }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail ?? NETWORK_ERROR };
      }
      const created = fromApi(await res.json());
      setEntries((prev) => [created, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  }

  const todaysEntry = useMemo(
    () => entries.find((entry) => isSameDay(entry.loggedAt, new Date().toISOString())) ?? null,
    [entries],
  );

  const value = useMemo(
    () => ({ entries, isLoading, logMood, todaysEntry }),
    [entries, isLoading, todaysEntry],
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within a MoodProvider');
  return ctx;
}
