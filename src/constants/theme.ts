// Fixed design tokens for MindAxis. Vibe: calming, clinical-but-friendly, secure.
// Reuse these tokens on every screen — don't introduce new colors without reason.
export const Colors = {
  surfaceBright: '#F8F9FF',
  surfaceContainerLow: '#eff4ff',
  primary: '#0058be',
  // Tints of `primary`, used only for gradient depth on primary surfaces — not a new hue.
  primaryLight: '#1c72d9',
  primaryDeep: '#003f8f',
  textDark: '#121c2a',
  textMuted: '#424754',

  white: '#ffffff',
  border: '#dbe4f5',
  danger: '#b3261e',
  dangerSurface: '#fdecea',
  success: '#1c7a4d',
} as const;

// Shared soft elevation so cards read as lifted surfaces rather than flat outlines.
export const CardShadow = {
  shadowColor: '#0a1f3d',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;
