export const colors = {
  // Brand Primary
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  primarySoft: '#F0FDFA',

  // Brand Secondary & Accent
  secondary: '#F4B942',
  secondaryDark: '#D89A16',
  secondaryLight: '#FEF3C7',
  accent: '#F59E0B',

  // Neutrals & Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status Indicators
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Philippine Transportation Modes
  jeepney: '#F59E0B',
  jeepneyLight: '#FEF3C7',
  bus: '#2563EB',
  busLight: '#DBEAFE',
  mrt: '#7C3AED',
  mrtLight: '#EDE9FE',
  lrt: '#DB2777',
  lrtLight: '#FCE7F3',
  uvexpress: '#0F766E',
  uvexpressLight: '#CCFBF1',
  tricycle: '#EA580C',
  tricycleLight: '#FFEDD5',
  walking: '#64748B',
  walkingLight: '#F1F5F9',
} as const;

export type ColorKey = keyof typeof colors;
