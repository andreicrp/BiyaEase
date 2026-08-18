import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useJourney } from '../context/JourneyContext';
import { MapView } from '../components/maps/MapView';
import { JourneyProgress } from '../components/journey/JourneyProgress';
import { JourneyInstructionCard } from '../components/journey/JourneyInstructionCard';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { ApiTransitStop, ApiPlace } from '../services/transitApiService';
import { JourneyStep } from '../types/journey.types';

interface ActiveJourneyScreenProps {
  onExit: () => void;
}

export const ActiveJourneyScreen: React.FC<ActiveJourneyScreenProps> = ({ onExit }) => {
  const {
    activeJourney,
    currentStep,
    currentLocation,
    progressResult,
    gpsError,
    advanceStep,
    completeJourney,
    cancelJourney,
  } = useJourney();

  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  if (!activeJourney) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Active Journey</Text>
        <Text style={styles.emptySubtitle}>Select a route to start navigation.</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCompleted = activeJourney.status === 'completed';

  // Extract stops and destination for MapView
  const mapStops: ApiTransitStop[] = useMemo(
    () =>
      activeJourney.steps
        .filter(
          (s: JourneyStep) =>
            s.latitude !== undefined &&
            s.longitude !== undefined &&
            (s.type === 'board' || s.type === 'alight')
        )
        .map((s: JourneyStep) => ({
          id: String(s.fromStopId || s.toStopId || s.id),
          name: s.fromStopName || s.toStopName || s.title,
          code: s.routeCode || 'STOP',
          latitude: s.latitude!,
          longitude: s.longitude!,
          mode: (s.mode as import('../types').TransitMode) || 'bus',
          mode_color: s.mode === 'jeepney' ? '#E11D48' : s.mode === 'mrt' ? '#2563EB' : '#0D9488',
        })),
    [activeJourney.steps]
  );

  const mapPlaces: ApiPlace[] = useMemo(
    () => [
      {
        id: 'active-dest',
        name: activeJourney.destination.name || 'Destination',
        category: 'Destination',
        address: activeJourney.destination.name || 'Metro Manila',
        latitude: activeJourney.destination.latitude,
        longitude: activeJourney.destination.longitude,
      },
    ],
    [activeJourney.destination.latitude, activeJourney.destination.longitude, activeJourney.destination.name]
  );

  const mapRegion = useMemo(
    () => ({
      latitude:
        currentStep?.latitude || currentLocation?.latitude || activeJourney.origin.latitude,
      longitude:
        currentStep?.longitude || currentLocation?.longitude || activeJourney.origin.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }),
    [
      currentStep?.latitude,
      currentStep?.longitude,
      currentLocation?.latitude,
      currentLocation?.longitude,
      activeJourney.origin.latitude,
      activeJourney.origin.longitude,
    ]
  );

  const handleStepAction = () => {
    if (
      activeJourney.status === 'walking_to_destination' ||
      activeJourney.currentStepIndex === activeJourney.steps.length - 1
    ) {
      completeJourney();
    } else {
      advanceStep();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    cancelJourney();
    onExit();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Top Status Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, isCompleted && styles.statusDotComplete]} />
            <Text style={styles.statusText}>
              {activeJourney.status === 'walking_to_stop'
                ? 'WALKING TO STOP'
                : activeJourney.status === 'boarding'
                  ? 'BOARDING TRANSIT'
                  : activeJourney.status === 'in_transit'
                    ? 'IN TRANSIT'
                    : activeJourney.status === 'alighting'
                      ? 'PREPARE TO GET OFF'
                      : activeJourney.status === 'walking_to_destination'
                        ? 'FINAL WALK'
                        : isCompleted
                          ? 'JOURNEY COMPLETE'
                          : 'ACTIVE COMMUTE'}
            </Text>
          </View>
          <Text style={styles.destHeader} numberOfLines={1}>
            To {activeJourney.destination.name || 'Destination'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelPill}
          onPress={() => setShowCancelModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel journey"
        >
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Status / Error Banner */}
      {gpsError && (
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsBannerText}>⚠️ {gpsError} · Manual advance available</Text>
        </View>
      )}

      {/* 2. Step Progress Bar */}
      <JourneyProgress
        steps={activeJourney.steps}
        currentStepIndex={activeJourney.currentStepIndex}
      />

      {/* 3. Full Interactive Map Area */}
      <View style={styles.mapArea}>
        <MapView
          height="100%"
          region={mapRegion}
          userLocation={
            currentLocation || {
              latitude: activeJourney.origin.latitude,
              longitude: activeJourney.origin.longitude,
            }
          }
          stops={mapStops}
          places={mapPlaces}
          polylines={
            activeJourney.polylineCoordinates && activeJourney.polylineCoordinates.length > 0
              ? [
                  {
                    id: 'active-route-poly',
                    coordinates: activeJourney.polylineCoordinates,
                    color: colors.primary,
                    strokeWidth: 5,
                  },
                ]
              : []
          }
          showControls={true}
          style={styles.map}
        />
      </View>

      {/* 4. Bottom Active Instruction Card or Completion Card */}
      <View style={styles.bottomArea}>
        {isCompleted ? (
          <View style={[styles.completionCard, shadows.floating]}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={styles.completionTitle}>You Have Arrived!</Text>
            <Text style={styles.completionSub}>
              Safely reached {activeJourney.destination.name || 'your destination'}.
            </Text>

            <View style={styles.metricSummaryRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Fare</Text>
                <Text style={styles.metricValue}>₱{activeJourney.totalFare || 13}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Est. Time</Text>
                <Text style={styles.metricValue}>
                  {activeJourney.totalDurationMinutes || 15} min
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Steps</Text>
                <Text style={styles.metricValue}>{activeJourney.steps.length} completed</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.finishBtn}
              onPress={() => {
                cancelJourney();
                onExit();
              }}
            >
              <Text style={styles.finishBtnText}>Back to Commute Planner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentStep && (
            <JourneyInstructionCard
              status={activeJourney.status}
              step={currentStep}
              progressResult={progressResult}
              onAction={handleStepAction}
              onCancel={() => setShowCancelModal(true)}
            />
          )
        )}
      </View>

      {/* 5. Cancellation Confirmation Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.floating]}>
            <Text style={styles.modalTitle}>Cancel this journey?</Text>
            <Text style={styles.modalSubtitle}>
              Your current active GPS progress and step tracking will be discarded.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalKeepText}>Continue Journey</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalDiscardBtn} onPress={handleConfirmCancel}>
                <Text style={styles.modalDiscardText}>Cancel Journey</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8ECF0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  statusDotComplete: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  destHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cancelPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  gpsBanner: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    alignItems: 'center',
  },
  gpsBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  mapArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#CBD5E1',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    pointerEvents: 'box-none',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  exitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  exitButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  completionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completionIcon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  completionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  completionSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  metricSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: colors.success,
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  finishBtnText: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: typography.fontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  modalKeepBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardAlt,
  },
  modalKeepText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalDiscardBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEE2E2',
  },
  modalDiscardText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#DC2626',
  },
});
