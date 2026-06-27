const DARK = {
  bg: '#0B0F1A',
  card: '#131929',
  cardAlt: '#1A2236',
  accent: '#4F7CFF',
  accentAlt: '#7C5CFF',
  accentDim: '#1E2E5E',
  success: '#22C55E',
  warn: '#F97316',
  danger: '#EF4444',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textDim: '#475569',
  border: '#1E2D45',
  borderStrong: '#2D3F5C',
};

const LIGHT = {
  bg: '#F8FAFF',
  card: '#FFFFFF',
  cardAlt: '#F1F5FF',
  accent: '#2563EB',
  accentAlt: '#7C3AED',
  accentDim: '#DBEAFE',
  success: '#16A34A',
  warn: '#EA580C',
  danger: '#DC2626',
  text: '#0F172A',
  textMuted: '#475569',
  textDim: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
};

export const Colors: typeof DARK = { ...DARK };

export const applyTheme = (isDark: boolean) => {
  const palette = isDark ? DARK : LIGHT;
  Object.assign(Colors, palette);
};

export const Typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  accent: {
    shadowColor: '#4F7CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};