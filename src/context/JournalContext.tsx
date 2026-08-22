import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

// Mock, in-memory only — no backend yet, same approach as Mood/Auth contexts.
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal-1',
    title: 'Exam week',
    body: "Midterms are stacking up and I haven't been sleeping well. Going to try to get to bed earlier tonight.",
    updatedAt: '2026-08-20T22:10:00',
  },
  {
    id: 'journal-2',
    title: '',
    body: 'Had a good conversation with a friend today. Felt lighter afterward.',
    updatedAt: '2026-08-17T19:30:00',
  },
];

type JournalContextValue = {
  entries: JournalEntry[];
  getEntry: (id: string) => JournalEntry | undefined;
  addEntry: (title: string, body: string) => JournalEntry;
  updateEntry: (id: string, title: string, body: string) => void;
  deleteEntry: (id: string) => void;
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);

  function getEntry(id: string) {
    return entries.find((entry) => entry.id === id);
  }

  function addEntry(title: string, body: string) {
    const entry: JournalEntry = {
      id: `journal-${Date.now()}`,
      title,
      body,
      updatedAt: new Date().toISOString(),
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }

  function updateEntry(id: string, title: string, body: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, title, body, updatedAt: new Date().toISOString() } : entry,
      ),
    );
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  const value = useMemo(
    () => ({ entries, getEntry, addEntry, updateEntry, deleteEntry }),
    [entries],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within a JournalProvider');
  return ctx;
}
