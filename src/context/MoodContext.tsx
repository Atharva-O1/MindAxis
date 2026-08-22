import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { MoodLevel } from '@/constants/moods';

export type MoodEntry = {
  id: string;
  level: MoodLevel;
  note: string;
  loggedAt: string;
};

// Mock, in-memory only — no backend yet. Seeded with a little history so the
// screen isn't empty on first load, same approach as mockSessions.ts.
const INITIAL_ENTRIES: MoodEntry[] = [
  { id: 'mood-1', level: 'okay', note: '', loggedAt: '2026-08-21T09:15:00' },
  { id: 'mood-2', level: 'good', note: 'Slept well', loggedAt: '2026-08-20T21:40:00' },
  { id: 'mood-3', level: 'low', note: '', loggedAt: '2026-08-19T14:05:00' },
];

type MoodContextValue = {
  entries: MoodEntry[];
  logMood: (level: MoodLevel, note?: string) => void;
  todaysEntry: MoodEntry | null;
};

const MoodContext = createContext<MoodContextValue | null>(null);

function isSameDay(isoA: string, isoB: string) {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

export function MoodProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MoodEntry[]>(INITIAL_ENTRIES);

  function logMood(level: MoodLevel, note = '') {
    setEntries((prev) => [
      { id: `mood-${Date.now()}`, level, note, loggedAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  const todaysEntry = useMemo(
    () => entries.find((entry) => isSameDay(entry.loggedAt, new Date().toISOString())) ?? null,
    [entries],
  );

  const value = useMemo(() => ({ entries, logMood, todaysEntry }), [entries, todaysEntry]);

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used within a MoodProvider');
  return ctx;
}
