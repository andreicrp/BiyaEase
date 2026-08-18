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
import { spacing, borderRadius } from '../../constants/spacing';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.JSX.Element | null;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'soft';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'outline',
  style,
  textStyle,
}) => {
  const getBackgroundColor = (): string => {
    if (variant === 'soft') return colors.primarySoft;
    return 'transparent';
  };

  const getBorderColor = (): string => {
    if (variant === 'ghost') return 'transparent';
    if (disabled) return colors.border;
    return colors.primary;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;
    return colors.primary;
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
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'ghost' ? 0 : 1.5,
          height,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
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
    minHeight: 44,
    minWidth: 44,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
});
