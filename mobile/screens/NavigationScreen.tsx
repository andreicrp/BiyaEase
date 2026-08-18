import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { MapPlaceholder } from '../components/maps/MapPlaceholder';
import { TransportIcon } from '../components/routes/TransportIcon';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { RouteOption } from '../types/index';

interface NavigationScreenProps {
  route: RouteOption;
  onEndTrip: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({ route, onEndTrip }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const currentStep = route.steps[currentStepIndex] || route.steps[0]!;
  const isLastStep = currentStepIndex >= route.steps.length - 1;

  const handleNextStep = (): void => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      Alert.alert('🎉 Arrived!', `You have reached ${route.destination}. Ingat sa biyahe!`, [
        { text: 'Complete Trip', onPress: onEndTrip },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Live Commute Navigation"
        subtitle={route.destination}
        rightAction={
          <View style={styles.liveStatusPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveStatusText}>ON YOUR WAY</Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Map Visualizer */}
        <MapPlaceholder
          height={240}
          origin={route.origin}
          destination={route.destination}
          activeStepIndex={currentStepIndex}
          showRouteLine={true}
          interactiveHint={`Active Step ${currentStepIndex + 1} of ${route.steps.length}`}
          style={styles.map}
        />

        {/* Next Immediate Commuter Action Card */}
        <View style={[styles.nextActionCard, shadows.card]}>
          <View style={styles.actionHeader}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>NEXT ACTION</Text>
            </View>
            <Text style={styles.stepProgressText}>
              Step {currentStepIndex + 1} of {route.steps.length}
            </Text>
          </View>

          {/* Main Transit Command */}
          <View style={styles.commandRow}>
            <TransportIcon mode={currentStep.mode} size="lg" />
            <View style={styles.commandTextWrapper}>
              <Text style={styles.commandTitle}>{currentStep.title}</Text>
              <Text style={styles.commandSubtitle}>{currentStep.subtitle}</Text>
            </View>
          </View>

          {/* Boarding/Alighting Guidance */}
          <View style={styles.guidanceBox}>
            <View style={styles.guidanceRow}>
              <Text style={styles.guidanceIcon}>📍</Text>
              <Text style={styles.guidanceText}>
                Board at: <Text style={styles.boldText}>{currentStep.originStop}</Text>
              </Text>
            </View>
            <View style={styles.guidanceRow}>
              <Text style={styles.guidanceIcon}>🏁</Text>
              <Text style={styles.guidanceText}>
                Get off at: <Text style={styles.boldText}>{currentStep.destinationStop}</Text>
              </Text>
            </View>
            {currentStep.stopsCount ? (
              <View style={styles.stopsRemainingPill}>
                <Text style={styles.stopsRemainingText}>
                  🔔 {currentStep.stopsCount} stops remaining before alight point
                </Text>
              </View>
            ) : null}
          </View>

          {/* Landmark Tip */}
          {currentStep.landmarkHint && (
            <View style={styles.tipBox}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{currentStep.landmarkHint}</Text>
            </View>
          )}

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>STEP TIME</Text>
              <Text style={styles.metricValue}>⏱ ~{currentStep.durationMinutes} min</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>STEP FARE</Text>
              <Text style={styles.metricValue}>
                {currentStep.fare ? `₱${currentStep.fare}` : 'Free walk'}
              </Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>TOTAL TRIP FARE</Text>
              <Text style={styles.metricValue}>₱{route.totalFare}</Text>
            </View>
          </View>
        </View>

        {/* Step Navigation Controls */}
        <View style={styles.stepControls}>
          <PrimaryButton
            title={isLastStep ? 'Complete Trip 🏁' : 'Next Step →'}
            onPress={handleNextStep}
            size="lg"
            style={styles.stepButton}
          />

          <SecondaryButton
            title="End Trip"
            onPress={onEndTrip}
            variant="ghost"
            style={styles.endButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  liveStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  map: {
    marginBottom: spacing.md,
  },
  nextActionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  actionBadgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.secondaryDark,
    letterSpacing: 0.5,
  },
  stepProgressText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  commandTextWrapper: {
    flex: 1,
    marginLeft: spacing.md,
  },
  commandTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  commandSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guidanceBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guidanceIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  guidanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stopsRemainingPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },
  stopsRemainingText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.secondaryDark,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metricCell: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepControls: {
    gap: spacing.sm,
  },
  stepButton: {
    width: '100%',
  },
  endButton: {
    width: '100%',
  },
});
