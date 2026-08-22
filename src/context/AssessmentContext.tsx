import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { loadJSON, saveJSON } from '@/lib/storage';

export type AssessmentType = 'PHQ-9' | 'GAD-7';

export type AssessmentResult = {
  id: string;
  type: AssessmentType;
  score: number;
  maxScore: number;
  completedAt: string;
};

const STORAGE_KEY = 'mindaxis.assessments.results';

type AssessmentContextValue = {
  results: AssessmentResult[];
  addResult: (type: AssessmentType, score: number, maxScore: number) => void;
  latestByType: (type: AssessmentType) => AssessmentResult | null;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    loadJSON<AssessmentResult[]>(STORAGE_KEY).then((stored) => {
      if (stored) setResults(stored);
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (hydrated.current) saveJSON(STORAGE_KEY, results);
  }, [results]);

  function addResult(type: AssessmentType, score: number, maxScore: number) {
    setResults((prev) => [
      { id: `assessment-${Date.now()}`, type, score, maxScore, completedAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  function latestByType(type: AssessmentType) {
    return results.find((result) => result.type === type) ?? null;
  }

  const value = useMemo(() => ({ results, addResult, latestByType }), [results]);

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessments() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessments must be used within an AssessmentProvider');
  return ctx;
}
