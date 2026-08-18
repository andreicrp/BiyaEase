import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { RouteOption } from '../../types/index';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { TransportIcon } from './TransportIcon';
import { FareBadge } from '../common/FareBadge';
import { TimeBadge } from '../common/TimeBadge';

interface RouteCardProps {
  route: RouteOption;
  onPress: (route: RouteOption) => void;
  isSelected?: boolean;
  style?: ViewStyle;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onPress,
  isSelected = false,
  style,
}) => {
  const getBadgeStyle = (label: string): { bg: string; text: string } => {
    switch (label) {
      case 'FASTEST':
        return { bg: colors.primaryLight, text: colors.primaryDark };
      case 'CHEAPEST':
        return { bg: colors.successLight, text: colors.success };
      case 'LESS WALKING':
        return { bg: colors.secondaryLight, text: colors.secondaryDark };
      case 'FEWER TRANSFERS':
      default:
        return { bg: colors.infoLight, text: colors.info };
    }
  };

  const badgeConfig = getBadgeStyle(route.label);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        shadows.card,
        route.isRecommended && styles.recommendedCard,
        isSelected && styles.selectedCard,
        style,
      ]}
      onPress={() => onPress(route)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Route ${route.label}, ${route.totalDurationMinutes} minutes, ₱${route.totalFare}`}
    >
      {/* Top Header: Badge Tag & Recommended Highlight */}
      <View style={styles.headerRow}>
        <View style={[styles.badgeTag, { backgroundColor: badgeConfig.bg }]}>
          <Text style={[styles.badgeText, { color: badgeConfig.text }]}>{route.label}</Text>
        </View>

        {route.isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>★ BEST MATCH</Text>
          </View>
        )}
      </View>

      {/* Main Metrics: Time & Fare */}
      <View style={styles.metricsRow}>
        <View style={styles.leftMetrics}>
          <TimeBadge durationMinutes={route.totalDurationMinutes} size="lg" />
          <View style={styles.fareContainer}>
            <FareBadge fare={route.totalFare} size="lg" variant="solid" />
          </View>
        </View>

        <View style={styles.rightMetrics}>
          <Text style={styles.transfersText}>
            {route.transfersCount === 0
              ? 'Direct ride'
              : `${route.transfersCount + 1} rides (${route.transfersCount} transfer)`}
          </Text>
          <Text style={styles.walkingText}>🚶 {route.walkingDistanceMeters}m walk</Text>
        </View>
      </View>

      {/* Summary Headline */}
      <Text style={styles.summaryText}>{route.summary}</Text>

      {/* Steps Transit Sequence Preview */}
      <View style={styles.stepsSequence}>
        {route.steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <View style={styles.stepIconItem}>
              <TransportIcon mode={step.mode} size="sm" />
            </View>
            {index < route.steps.length - 1 && <Text style={styles.arrowIcon}>→</Text>}
          </React.Fragment>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  recommendedCard: {
    borderColor: colors.primary,
    backgroundColor: '#FCFDFD',
  },
  selectedCard: {
    borderColor: colors.primaryDark,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badgeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  recommendedText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.secondaryDark,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  leftMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareContainer: {
    marginLeft: spacing.sm,
  },
  rightMetrics: {
    alignItems: 'flex-end',
  },
  transfersText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  walkingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepsSequence: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  stepIconItem: {
    marginRight: 2,
  },
  arrowIcon: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 6,
    fontWeight: '700',
  },
});
