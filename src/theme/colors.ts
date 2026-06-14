export const Colors = {
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