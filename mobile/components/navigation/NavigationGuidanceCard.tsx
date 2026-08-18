import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { NavigationState } from '../../navigation/navigationTypes';

interface NavigationGuidanceCardProps {
  navigationState: NavigationState;
  onAction: () => void;
  onCancel?: () => void;
}

export const NavigationGuidanceCard: React.FC<NavigationGuidanceCardProps> = ({
  navigationState,
  onAction,
}) => {
  const {
    currentStep,
    status,
    distanceToTargetMeters,
    estimatedRemainingMinutes,
    progressPercent,
  } = navigationState;

  if (!currentStep) return null;

  const getStatusBadge = () => {
    switch (status) {
      case 'approaching_board':
        return { label: '🚏 APPROACHING BOARDING', bg: '#EFF6FF', color: '#1D4ED8' };
      case 'boarding':
        return { label: '📍 AT BOARDING STOP', bg: '#EFF6FF', color: '#1D4ED8' };
      case 'in_transit':
        return { label: '🚐 IN TRANSIT', bg: colors.primaryLight, color: colors.primaryDark };
      case 'approaching_alight':
        return { label: '🔔 GET READY TO ALIGHT', bg: '#FEF3C7', color: '#B45309' };
      case 'alighting':
        return { label: '🛑 AT ALIGHT STOP', bg: '#FEF2F2', color: '#B91C1C' };
      case 'transfer':
        return { label: '🔄 TRANSFER POINT', bg: '#FDF4FF', color: '#86198F' };
      case 'arrived':
        return { label: '🎉 DESTINATION ARRIVAL', bg: '#ECFDF5', color: '#047857' };
      case 'walking_to_destination':
        return { label: '🚶 FINAL WALK', bg: '#F3F4F6', color: colors.textPrimary };
      case 'off_route':
        return { label: '⚠️ OFF ROUTE', bg: '#FFF1F2', color: '#9F1239' };
      default:
        return { label: '🚶 WALK TO STOP', bg: '#F3F4F6', color: colors.textPrimary };
    }
  };

  const badge = getStatusBadge();

  const getActionButtonTitle = () => {
    switch (status) {
      case 'approaching_board':
      case 'boarding':
      case 'walking_to_board':
        return `I've Boarded ${currentStep.routeCode || 'Transit'} 🚐`;
      case 'approaching_alight':
      case 'alighting':
      case 'in_transit':
        return "I've Alighted 🛑";
      case 'transfer':
        return 'Continue Transfer 🔄';
      case 'arrived':
      case 'walking_to_destination':
        return 'Complete Journey 🎉';
      default:
        return 'Next Step →';
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <View style={[styles.card, shadows.floating]}>
      {/* 1. Status Badge & ETA Row */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
        <Text style={styles.etaText}>
          ~{estimatedRemainingMinutes} min · {formatDistance(distanceToTargetMeters)}
        </Text>
      </View>

      {/* 2. Main Instruction Heading */}
      <Text style={styles.instructionTitle} numberOfLines={2}>
        {currentStep.title}
      </Text>

      {currentStep.subtitle && (
        <Text style={styles.instructionSubtitle} numberOfLines={2}>
          {currentStep.subtitle}
        </Text>
      )}

      {/* 3. Leg Progress Indicator */}
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBarFill, { width: `${Math.max(5, progressPercent)}%` }]} />
      </View>

      {/* 4. Action Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.85}>
        <Text style={styles.actionButtonText}>{getActionButtonTitle()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  etaText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  instructionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  instructionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  progressBarWrapper: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
