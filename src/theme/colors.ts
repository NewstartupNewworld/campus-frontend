export const Colors = {
  bg: '#0F1115',
  card: '#1A1D24',
  cardAlt: '#1F2330',
  accent: '#4F8CFF',
  accentDim: '#2A4A8A',
  success: '#3DDC84',
  warn: '#FFB347',
  danger: '#FF5C5C',
  text: '#FFFFFF',
  textMuted: '#8A8FA8',
  textDim: '#555B72',
  border: '#252A38',
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: '900' as const, color: Colors.text },
  h2: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 11, fontWeight: '700' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
};
