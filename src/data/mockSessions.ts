// Mock data — trivial to swap for a real `/sessions` fetch once the backend exists.
export type MoodTag = 'calm' | 'anxious' | 'low' | 'okay' | 'stressed';

export type ChatSession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  mood: MoodTag;
};

export const MOCK_SESSIONS: ChatSession[] = [
  { id: 'sess-1', startedAt: '2026-08-20T21:15:00', durationMinutes: 12, mood: 'anxious' },
  { id: 'sess-2', startedAt: '2026-08-19T09:40:00', durationMinutes: 6, mood: 'okay' },
  { id: 'sess-3', startedAt: '2026-08-17T22:05:00', durationMinutes: 21, mood: 'low' },
  { id: 'sess-4', startedAt: '2026-08-15T14:30:00', durationMinutes: 4, mood: 'calm' },
  { id: 'sess-5', startedAt: '2026-08-12T20:50:00', durationMinutes: 15, mood: 'stressed' },
];
