import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

interface TimeBadgeProps {
  durationMinutes: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  style?: ViewStyle;
}

export const TimeBadge: React.FC<TimeBadgeProps> = ({
  durationMinutes,
  size = 'md',
  showIcon = true,
  style,
}) => {
  const paddingH = size === 'sm' ? spacing.xs : size === 'lg' ? spacing.md : spacing.sm;
  const paddingV = size === 'sm' ? 2 : size === 'lg' ? 6 : 4;
  const fontSize =
    size === 'sm'
      ? typography.fontSize.xs
      : size === 'lg'
        ? typography.fontSize.md
        : typography.fontSize.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
        style,
      ]}
    >
      {showIcon && <Text style={[styles.icon, { fontSize: fontSize - 2 }]}>⏱</Text>}
      <Text style={[styles.text, { fontSize }]}>{durationMinutes} min</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
