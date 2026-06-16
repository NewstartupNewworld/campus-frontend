const DARK = {
  bg: '#0B0D12',
  card: '#15171F',
  cardAlt: '#1B1E29',
  accent: '#5B8DEF',
  accentAlt: '#8B7CFF',
  accentDim: '#2E3B5E',
  success: '#3DDC84',
  warn: '#FFB347',
  danger: '#FF6B6B',
  text: '#F4F4F6',
  textMuted: '#9398AB',
  textDim: '#5C6178',
  border: '#23262F',
  borderStrong: '#33384A',
};

const LIGHT = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardAlt: '#F0F1F6',
  accent: '#4F7EE0',
  accentAlt: '#7B63E8',
  accentDim: '#D6E0F7',
  success: '#2BAE66',
  warn: '#E08F1F',
  danger: '#E4504F',
  text: '#15171F',
  textMuted: '#5C6178',
  textDim: '#9398AB',
  border: '#E2E4ED',
  borderStrong: '#CBCFDD',
};

// Mutable object — screens import `Colors` once and read properties off it.
// ThemeProvider mutates these properties in place when toggled, then forces
// a full app remount via a `key` so every screen re-renders with new values.
export const Colors: typeof DARK = { ...DARK };

export const applyTheme = (isDark: boolean) => {
  const palette = isDark ? DARK : LIGHT;
  Object.assign(Colors, palette);
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 19, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 11, fontWeight: '700' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};