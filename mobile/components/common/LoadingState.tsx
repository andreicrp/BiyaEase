import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { Mascot } from './Mascot';

interface LoadingStateProps {
  message?: string;
  showMascot?: boolean;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Calculating commute routes...',
  showMascot = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showMascot && <Mascot size={64} mood="navigating" style={styles.mascot} />}
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  mascot: {
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
