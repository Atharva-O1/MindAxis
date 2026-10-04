import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';

export type AssessmentType = 'PHQ-9' | 'GAD-7';

export type AssessmentResult = {
  id: string;
  type: AssessmentType;
  score: number;
  maxScore: number;
  completedAt: string;
};

type AddResultOutcome = { success: boolean; error?: string };

type AssessmentContextValue = {
  results: AssessmentResult[];
  isLoading: boolean;
  addResult: (type: AssessmentType, score: number, maxScore: number) => Promise<AddResultOutcome>;
  latestByType: (type: AssessmentType) => AssessmentResult | null;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const NETWORK_ERROR = 'Could not reach the server. Is the backend running?';

function fromApi(raw: any): AssessmentResult {
  return {
    id: raw.id,
    type: raw.type,
    score: raw.score,
    maxScore: raw.max_score,
    completedAt: raw.completed_at,
  };
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { status, token } = useAuth();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== 'signedIn' || !token) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    fetch(`${API_BASE_URL}/assessments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setResults(data.map(fromApi)))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [status, token]);

  async function addResult(
    type: AssessmentType,
    score: number,
    maxScore: number,
  ): Promise<AddResultOutcome> {
    if (!token) return { success: false, error: 'Not signed in.' };
    try {
      const res = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, score, max_score: maxScore }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail ?? NETWORK_ERROR };
      }
      const created = fromApi(await res.json());
      setResults((prev) => [created, ...prev]);
      return { success: true };
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }
  }

  function latestByType(type: AssessmentType) {
    return results.find((result) => result.type === type) ?? null;
  }

  const value = useMemo(
    () => ({ results, isLoading, addResult, latestByType }),
    [results, isLoading],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessments() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessments must be used within an AssessmentProvider');
  return ctx;
}
