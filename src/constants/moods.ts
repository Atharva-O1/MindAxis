export type MoodLevel = 'great' | 'good' | 'okay' | 'low' | 'awful';

export type MoodOption = {
  level: MoodLevel;
  emoji: string;
  label: string;
  color: string;
  background: string;
};

// Shared 5-point mood scale for daily check-ins. Distinct from the per-session
// mood tags in `data/mockSessions.ts`, which describe how a single chat went.
export const MOOD_SCALE: MoodOption[] = [
  { level: 'great', emoji: '😄', label: 'Great', color: '#1c7a4d', background: '#e4f5ec' },
  { level: 'good', emoji: '🙂', label: 'Good', color: '#0058be', background: '#eff4ff' },
  { level: 'okay', emoji: '😐', label: 'Okay', color: '#424754', background: '#eef0f3' },
  { level: 'low', emoji: '😔', label: 'Low', color: '#5b4fc4', background: '#ece9fb' },
  { level: 'awful', emoji: '😣', label: 'Awful', color: '#b3261e', background: '#fdecea' },
];

export function getMoodOption(level: MoodLevel): MoodOption {
  return MOOD_SCALE.find((option) => option.level === level) ?? MOOD_SCALE[2];
}
