import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { RouteOption, RouteStep } from '../../types/index';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { TransportIcon } from './TransportIcon';

interface RouteTimelineProps {
  route: RouteOption;
  activeStepIndex?: number;
  style?: ViewStyle;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ route, activeStepIndex, style }) => {
  const renderStep = (step: RouteStep, index: number, isLast: boolean): React.JSX.Element => {
    const isActive = activeStepIndex === index;

    return (
      <View key={step.id} style={styles.stepRow}>
        {/* Left Column: Vertical Line & Node */}
        <View style={styles.timelineAxis}>
          <View
            style={[
              styles.nodeCircle,
              {
                borderColor: isActive ? colors.secondary : colors.primary,
                backgroundColor: isActive ? colors.secondaryLight : colors.surface,
              },
            ]}
          >
            <TransportIcon mode={step.mode} size="sm" />
          </View>
          {!isLast && (
            <View
              style={[styles.timelineLine, step.mode === 'walking' && styles.walkingDashedLine]}
            />
          )}
        </View>

        {/* Right Column: Step Content Card */}
        <View style={[styles.stepCard, isActive && styles.activeStepCard]}>
          {/* Header row: Mode & Duration/Distance */}
          <View style={styles.stepHeader}>
            <View style={styles.modeTag}>
              <Text style={styles.modeTagText}>
                {step.mode.toUpperCase()}
                {step.vehicleNumber ? ` · ${step.vehicleNumber}` : ''}
              </Text>
            </View>

            <Text style={styles.stepMetrics}>
              {step.durationMinutes} min (
              {step.distanceMeters >= 1000
                ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                : `${step.distanceMeters} m`}
              )
            </Text>
          </View>

          {/* Step Main Title & Subtitle */}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

          {/* Boarding and Alighting Cues */}
          <View style={styles.stopsBox}>
            <View style={styles.stopItem}>
              <Text style={styles.stopBullet}>🟢</Text>
              <View style={styles.stopInfo}>
                <Text style={styles.stopLabel}>Board at</Text>
                <Text style={styles.stopName}>{step.originStop}</Text>
              </View>
            </View>

            {step.stopsCount ? (
              <View style={styles.stopsCounter}>
                <Text style={styles.stopsCountText}>↓ {step.stopsCount} stops in transit</Text>
              </View>
            ) : null}

            <View style={styles.stopItem}>
              <Text style={styles.stopBullet}>🔴</Text>
              <View style={styles.stopInfo}>
                <Text style={styles.stopLabel}>Alight at</Text>
                <Text style={styles.stopName}>{step.destinationStop}</Text>
              </View>
            </View>
          </View>

          {/* Landmark Hint / Instructions */}
          {step.landmarkHint && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintIcon}>💡</Text>
              <Text style={styles.hintText}>{step.landmarkHint}</Text>
            </View>
          )}

          {step.fare ? (
            <View style={styles.fareTag}>
              <Text style={styles.fareTagText}>Est. Fare: ₱{step.fare}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Starting Origin Banner */}
      <View style={styles.endpointBanner}>
        <Text style={styles.endpointIcon}>🟢</Text>
        <View style={styles.endpointInfo}>
          <Text style={styles.endpointLabel}>START POINT</Text>
          <Text style={styles.endpointName}>{route.origin}</Text>
        </View>
      </View>

      {/* Steps List */}
      <View style={styles.stepsList}>
        {route.steps.map((step, idx) => renderStep(step, idx, idx === route.steps.length - 1))}
      </View>

      {/* Destination Final Banner */}
      <View style={styles.endpointBanner}>
        <Text style={styles.endpointIcon}>🏁</Text>
        <View style={styles.endpointInfo}>
          <Text style={styles.endpointLabel}>DESTINATION</Text>
          <Text style={styles.endpointName}>{route.destination}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  endpointBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endpointIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  endpointInfo: {
    flex: 1,
  },
  endpointLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  endpointName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  stepsList: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineAxis: {
    width: 36,
    alignItems: 'center',
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 3,
    flex: 1,
    backgroundColor: colors.primaryLight,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1.5,
  },
  walkingDashedLine: {
    backgroundColor: colors.walkingLight,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.walking,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  activeStepCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  modeTag: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  modeTagText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stepMetrics: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stopsBox: {
    backgroundColor: colors.cardAlt,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopBullet: {
    fontSize: 10,
    marginRight: 6,
  },
  stopInfo: {
    flex: 1,
  },
  stopLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stopName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stopsCounter: {
    paddingLeft: 16,
    paddingVertical: 4,
  },
  stopsCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  hintIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  hintText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.secondaryDark,
  },
  fareTag: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  fareTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
