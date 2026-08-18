import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { JourneyStatus } from '../../types/journey.types';

interface JourneyActionButtonProps {
  status: JourneyStatus;
  isNearTarget?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const JourneyActionButton: React.FC<JourneyActionButtonProps> = ({
  status,
  isNearTarget = false,
  onPress,
  style,
}) => {
  let label = 'Continue';
  let icon = '➔';
  let backgroundColor: string = colors.primary;

  switch (status) {
    case 'ready':
      label = 'Start Journey';
      icon = '🚀';
      backgroundColor = colors.primary;
      break;
    case 'walking_to_stop':
      label = isNearTarget ? "I'm at the Stop" : "I've arrived";
      icon = '📍';
      backgroundColor = isNearTarget ? colors.accent : colors.primary;
      break;
    case 'boarding':
      label = "I've Boarded";
      icon = '🚐';
      backgroundColor = colors.secondary;
      break;
    case 'in_transit':
      label = isNearTarget ? 'Get Off Here' : 'Alighting Soon';
      icon = '🔔';
      backgroundColor = isNearTarget ? '#DC2626' : colors.primary;
      break;
    case 'alighting':
      label = 'Continue Walking';
      icon = '🚶';
      backgroundColor = colors.primary;
      break;
    case 'walking_to_destination':
      label = isNearTarget ? 'Finish Journey 🎉' : 'I Have Arrived';
      icon = '🏁';
      backgroundColor = colors.success;
      break;
    case 'completed':
      label = 'Done';
      icon = '✅';
      backgroundColor = colors.success;
      break;
    default:
      label = 'Next Step';
  }

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, shadows.medium, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
});
