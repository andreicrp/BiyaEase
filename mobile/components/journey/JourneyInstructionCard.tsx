import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JourneyStep, JourneyStatus } from '../../types/journey.types';
import { StepProgressResult } from '../../services/journeyProgressService';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { JourneyActionButton } from './JourneyActionButton';

interface JourneyInstructionCardProps {
  status: JourneyStatus;
  step: JourneyStep;
  progressResult: StepProgressResult | null;
  onAction: () => void;
  onCancel: () => void;
}

export const JourneyInstructionCard: React.FC<JourneyInstructionCardProps> = ({
  status,
  step,
  progressResult,
  onAction,
}) => {
  const isNear = progressResult?.isNearTarget || false;
  const isOffRoute = progressResult?.isOffRoute || false;
  const displayDist = progressResult?.distanceMeters
    ? progressResult.distanceMeters >= 1000
      ? `${(progressResult.distanceMeters / 1000).toFixed(1)} km`
      : `${progressResult.distanceMeters} m`
    : step.distanceMeters
      ? `${step.distanceMeters} m`
      : undefined;

  return (
    <View style={[styles.card, shadows.floating]}>
      {/* Alert Banner if Near Target or Off Route */}
      {isNear && (
        <View style={styles.alertNearBanner}>
          <Text style={styles.alertIcon}>📍</Text>
          <Text style={styles.alertNearText}>{progressResult?.message || 'Near Target Stop!'}</Text>
        </View>
      )}

      {isOffRoute && !isNear && (
        <View style={styles.alertOffRouteBanner}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertOffRouteText}>You may be moving away from your target stop</Text>
        </View>
      )}

      {/* Mode & Step Header */}
      <View style={styles.headerRow}>
        <View style={styles.modeTag}>
          <Text style={styles.modeIcon}>
            {step.mode === 'jeepney'
              ? '🚐'
              : step.mode === 'bus'
                ? '🚌'
                : step.mode === 'mrt' || step.mode === 'lrt'
                  ? '🚆'
                  : '🚶'}
          </Text>
          <Text style={styles.modeText}>
            {step.routeCode || (step.mode ? step.mode.toUpperCase() : 'WALK')}
          </Text>
        </View>

        {displayDist && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{displayDist}</Text>
            {step.estimatedMinutes && (
              <Text style={styles.etaText}>· ~{step.estimatedMinutes} min</Text>
            )}
          </View>
        )}
      </View>

      {/* Main Step Instruction */}
      <Text style={styles.mainTitle}>{step.title}</Text>

      {step.subtitle && <Text style={styles.subTitle}>{step.subtitle}</Text>}

      {/* Transit Specific Boarding / Alighting Info */}
      {step.fromStopName && step.type === 'board' && (
        <View style={styles.stopInfoBox}>
          <Text style={styles.stopInfoLabel}>Boarding at:</Text>
          <Text style={styles.stopInfoName}>{step.fromStopName}</Text>
        </View>
      )}

      {step.toStopName && (step.type === 'transit' || step.type === 'alight') && (
        <View style={styles.stopInfoBox}>
          <Text style={styles.stopInfoLabel}>Get off at:</Text>
          <Text style={styles.stopInfoName}>{step.toStopName}</Text>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.actionWrapper}>
        <JourneyActionButton status={status} isNearTarget={isNear} onPress={onAction} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertNearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  alertNearText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 6,
  },
  alertOffRouteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertOffRouteText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },
  alertIcon: {
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  modeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  etaText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    marginLeft: 3,
  },
  mainTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  subTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stopInfoBox: {
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  stopInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  stopInfoName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  actionWrapper: {
    marginTop: spacing.md,
  },
});
