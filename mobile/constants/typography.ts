import { TextStyle } from 'react-native';

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const textStyles: Record<string, TextStyle> = {
  displayTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  bodyLarge: {
    fontSize: typography.fontSize.md,
    fontWeight: '400',
  },
  body: {
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  captionMedium: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  badge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};
