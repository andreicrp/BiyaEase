import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.JSX.Element | null;
  iconRight?: React.JSX.Element | null;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const getBackgroundColor = (): string => {
    if (disabled) return colors.border;
    if (variant === 'secondary') return colors.secondary;
    if (variant === 'danger') return colors.error;
    return colors.primary;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary') return colors.textPrimary;
    return colors.textInverse;
  };

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const paddingH = size === 'sm' ? spacing.md : spacing.xl;
  const fontSize =
    size === 'sm'
      ? typography.fontSize.sm
      : size === 'lg'
        ? typography.fontSize.md
        : typography.fontSize.sm;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        shadows.subtle,
        {
          backgroundColor: getBackgroundColor(),
          height,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // 44x44 accessible minimum touch target
    minWidth: 44,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
