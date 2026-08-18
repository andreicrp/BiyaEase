import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

interface FareBadgeProps {
  fare: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'soft';
  style?: ViewStyle;
}

export const FareBadge: React.FC<FareBadgeProps> = ({
  fare,
  size = 'md',
  variant = 'soft',
  style,
}) => {
  const isSolid = variant === 'solid';
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
          backgroundColor: isSolid ? colors.primary : colors.primaryLight,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: isSolid ? colors.textInverse : colors.primaryDark,
            fontSize,
          },
        ]}
      >
        ₱{fare}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
  },
});
