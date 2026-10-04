import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

type JournalResult = { success: boolean; error?: string };

type JournalContextValue = {
  entries: JournalEntry[];
  isLoading: boolean;
  getEntry: (id: string) => JournalEntry | undefined;
  addEntry: (title: string, body: string) => Promise<JournalResult>;
  updateEntry: (id: string, title: string, body: string) => Promise<JournalResult>;
  deleteEntry: (id: string) => Promise<JournalResult>;
};

const JournalContext = createContext<JournalContextValue | null>(null);

const NETWORK_ERROR = 'Could not reach the server. Is the backend running?';

function fromApi(raw: any): JournalEntry {
  return { id: raw.id, title: raw.title, body: raw.body, updatedAt: raw.updated_at };
}

export function JournalProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn' || !token) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    fetch(`${API_BASE_URL}/journal`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEntries(data.map(fromApi)))
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));
  }, [status, token]);

  function getEntry(id: string) {
    return entries.find((entry) => entry.id === id);
  }

  async function addEntry(title: string, body: string): Promise<JournalResult> {
    if (!token) return { success: false, error: 'Not signed in.' };
    try {
      const res = await fetch(`${API_BASE_URL}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, body }),
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

  async function updateEntry(id: string, title: string, body: string): Promise<JournalResult> {
    if (!token) return { success: false, error: 'Not signed in.' };
    try {
      const res = await fetch(`${API_BASE_URL}/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail ?? NETWORK_ERROR };
      }
      const updated = fromApi(await res.json());
      setEntries((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
      return { success: true };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  }

  async function deleteEntry(id: string): Promise<JournalResult> {
    if (!token) return { success: false, error: 'Not signed in.' };
    try {
      const res = await fetch(`${API_BASE_URL}/journal/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail ?? NETWORK_ERROR };
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      return { success: true };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  }

  const value = useMemo(
    () => ({ entries, isLoading, getEntry, addEntry, updateEntry, deleteEntry }),
    [entries, isLoading],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within a JournalProvider');
  return ctx;
}
