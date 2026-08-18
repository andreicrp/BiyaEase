import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { MapView, MapPolylineItem } from '../components/maps/MapView';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { FareBadge } from '../components/common/FareBadge';
import { TimeBadge } from '../components/common/TimeBadge';
import { ApiTransitStop } from '../services/transitApiService';
import { Coordinates, interpolateRoadCorridor } from '../utils/geoUtils';
import { RouteOption } from '../types/index';
import { Journey, JourneyMode } from '../types/routing.types';

interface RouteDetailsScreenProps {
  route: Journey | RouteOption;
  onBack: () => void;
  onStartTrip: (route: Journey | RouteOption) => void;
}

export const RouteDetailsScreen: React.FC<RouteDetailsScreenProps> = ({
  route,
  onBack,
  onStartTrip,
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [routeStops, setRouteStops] = useState<ApiTransitStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<ApiTransitStop | null>(null);

  // Extract metadata whether route is Journey or legacy RouteOption
  const isJourney = 'segments' in route && Array.isArray((route as Journey).segments);
  const journey = isJourney ? (route as Journey) : null;
  const legacyOption = !isJourney ? (route as RouteOption) : null;

  const durationMinutes = journey
    ? journey.durationMinutes
    : legacyOption?.totalDurationMinutes || 30;
  const totalFare = journey ? journey.fare : legacyOption?.totalFare || 15;
  const walkingDistance = journey
    ? journey.walkingDistanceMeters
    : legacyOption?.walkingDistanceMeters || 300;
  const transfersCount = journey ? journey.transfers : legacyOption?.transfersCount || 0;
  const summaryTitle = journey ? journey.summary : legacyOption?.summary || 'Route Details';
  const labelText = journey?.label || legacyOption?.label || 'COMMUTE OPTION';

  useEffect(() => {
    if (journey) {
      // Extract coordinates from all segment LineString geometries
      const allCoords: Coordinates[] = [];
      const stops: ApiTransitStop[] = [];

      journey.segments.forEach((seg, sIdx) => {
        if (seg.geometry && Array.isArray(seg.geometry.coordinates)) {
          seg.geometry.coordinates.forEach(([lng, lat]) => {
            allCoords.push({ latitude: lat, longitude: lng });
          });
        }

        if (seg.fromStop) {
          stops.push({
            id: `stop-from-${sIdx}`,
            name: seg.fromStop.name,
            code: seg.fromStop.code || `SEG-${sIdx + 1}`,
            latitude: seg.fromStop.latitude,
            longitude: seg.fromStop.longitude,
            mode: seg.mode,
          });
        }
        if (seg.toStop) {
          stops.push({
            id: `stop-to-${sIdx}`,
            name: seg.toStop.name,
            code: seg.toStop.code || `ALIGHT-${sIdx + 1}`,
            latitude: seg.toStop.latitude,
            longitude: seg.toStop.longitude,
            mode: seg.mode,
          });
        }
      });

      // If no LineString coords in segments, use stop points
      if (allCoords.length === 0 && stops.length >= 2) {
        stops.forEach((s) => allCoords.push({ latitude: s.latitude, longitude: s.longitude }));
      }

      setRouteCoordinates(interpolateRoadCorridor(allCoords));
      setRouteStops(stops);
    } else if (legacyOption) {
      const fallbackPoints: Coordinates[] = legacyOption.steps
        .filter((s) => s.coordinates)
        .map((s) => s.coordinates!);

      const stopsData: ApiTransitStop[] = legacyOption.steps.map((s, idx) => ({
        id: `step-stop-${idx}`,
        name: s.originStop || s.title,
        code: `STOP-${idx + 1}`,
        latitude: s.coordinates?.latitude || (14.6538 - idx * 0.001),
        longitude: s.coordinates?.longitude || (121.0685 - idx * 0.01),
        mode: s.mode,
      }));

      setRouteCoordinates(interpolateRoadCorridor(fallbackPoints));
      setRouteStops(stopsData);
    }
  }, [journey, legacyOption]);

  const originCoord = React.useMemo(() => {
    if (journey?.origin?.latitude && journey?.origin?.longitude) {
      return { latitude: journey.origin.latitude, longitude: journey.origin.longitude };
    }
    return routeCoordinates[0] || { latitude: 14.6538, longitude: 121.0685 };
  }, [journey, routeCoordinates]);

  const destCoord = React.useMemo(() => {
    if (journey?.destination?.latitude && journey?.destination?.longitude) {
      return { latitude: journey.destination.latitude, longitude: journey.destination.longitude };
    }
    return routeCoordinates[routeCoordinates.length - 1] || { latitude: 14.6565, longitude: 121.0288 };
  }, [journey, routeCoordinates]);

  const polylines: MapPolylineItem[] = React.useMemo(() => {
    if (journey?.segments && journey.segments.length > 0) {
      return journey.segments.map((seg, idx) => {
        const segCoords: Coordinates[] = [];
        if (seg.geometry && Array.isArray(seg.geometry.coordinates)) {
          seg.geometry.coordinates.forEach(([lng, lat]) => {
            segCoords.push({ latitude: lat, longitude: lng });
          });
        }
        if (segCoords.length === 0) {
          if (seg.fromStop) segCoords.push({ latitude: seg.fromStop.latitude, longitude: seg.fromStop.longitude });
          if (seg.toStop) segCoords.push({ latitude: seg.toStop.latitude, longitude: seg.toStop.longitude });
        }

        const isWalk = seg.type === 'walking' || seg.mode === 'walking';
        const color = isWalk
          ? '#10B981'
          : seg.mode === 'jeepney'
            ? '#D97706'
            : seg.mode === 'bus'
              ? '#16A34A'
              : seg.mode === 'mrt' || seg.mode === 'lrt'
                ? '#7C3AED'
                : colors.primary;

        return {
          id: `seg-poly-${idx}`,
          coordinates: interpolateRoadCorridor(segCoords),
          color,
          strokeWidth: isWalk ? 4 : 6,
          isDashed: isWalk,
        };
      });
    }

    const coordsToUse =
      routeCoordinates.length >= 3
        ? routeCoordinates
        : [
            { latitude: 14.6538, longitude: 121.0685 },
            { latitude: 14.6532, longitude: 121.0612 },
            { latitude: 14.6542, longitude: 121.0535 },
            { latitude: 14.6515, longitude: 121.0488 },
            { latitude: 14.6536, longitude: 121.0410 },
            { latitude: 14.6558, longitude: 121.0332 },
            { latitude: 14.6565, longitude: 121.0288 },
          ];

    return [
      {
        id: `poly-${journey?.id || legacyOption?.id || 'route'}`,
        coordinates: interpolateRoadCorridor(coordsToUse),
        color: '#16A34A',
        strokeWidth: 6,
      },
    ];
  }, [journey, legacyOption?.id, routeCoordinates]);

  const originName = journey?.origin?.name || legacyOption?.origin || 'Start';
  const destName = journey?.destination?.name || legacyOption?.destination || 'End';

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={`${originName} ➔ ${destName}`} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Real Map Visualization with Start/End Pins & Multi-Segment Polylines */}
        <View style={styles.mapWrapper}>
          <MapView
            height={240}
            polylines={polylines}
            originCoordinate={originCoord}
            destinationCoordinate={destCoord}
            stops={routeStops}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            fitCoordinates={[originCoord, destCoord, ...(polylines[0]?.coordinates || [])]}
            showControls={true}
            style={styles.map}
          />
        </View>

        {/* Route Overview & Segment Progress Strip Card */}
        <View style={[styles.summaryCard, shadows.card]}>
          {/* Header & Mode Progress Line */}
          <View style={styles.headerInfoRow}>
            <View style={styles.timeMainRow}>
              <Text style={styles.timeMainText}>{durationMinutes} min</Text>
              <Text style={styles.timeSubText}>
                Arrive ~{Math.round(durationMinutes + 5)} min · {walkingDistance}m walk
              </Text>
            </View>
            <View style={styles.fareTag}>
              <Text style={styles.fareTagText}>₱{totalFare}.00</Text>
            </View>
          </View>

          {/* Mode Segment Bar Strip matching target design */}
          <View style={styles.modeStripContainer}>
            {journey?.segments ? (
              journey.segments.map((seg, idx) => (
                <React.Fragment key={`mode-strip-${idx}`}>
                  <View style={styles.modeItem}>
                    <Text style={styles.modeIconText}>
                      {seg.mode === 'jeepney'
                        ? '🛺'
                        : seg.mode === 'bus'
                          ? '🚌'
                          : seg.mode === 'mrt' || seg.mode === 'lrt'
                            ? '🚆'
                            : '🚶'}
                    </Text>
                    <Text style={styles.modeLabelText}>
                      {seg.mode === 'walking' ? '' : seg.mode.toUpperCase()}
                    </Text>
                  </View>
                  {idx < journey.segments.length - 1 && (
                    <Text style={styles.modeArrow}>›</Text>
                  )}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.modeItem}>
                <Text style={styles.modeIconText}>🚶 › 🚌 Bus › 🛺 Jeep › 🚶</Text>
              </View>
            )}
          </View>
        </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TOTAL WALK</Text>
              <Text style={styles.metricValue}>🚶 {walkingDistance}m</Text>
            </View>
          </View>
        </View>

        {/* Commute Step-by-Step Directions */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineSectionTitle}>STEP-BY-STEP DIRECTIONS</Text>

          {journey && (
            <View style={styles.stepsContainer}>
              {journey.segments.map((seg, idx) => (
                <View key={`jseg-${idx}`} style={styles.stepItem}>
                  {/* Step Connector Line & Icon */}
                  <View style={styles.stepIconColumn}>
                    <View
                      style={[
                        styles.stepIconBubble,
                        seg.type === 'transit' ? styles.transitBubble : styles.walkingBubble,
                      ]}
                    >
                      <Text style={styles.stepEmoji}>{getModeEmoji(seg.mode)}</Text>
                    </View>
                    {idx < journey.segments.length - 1 && <View style={styles.stepDottedLine} />}
                  </View>

                  {/* Step Content */}
                  <View style={styles.stepContentCard}>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.stepTitle}>
                        {seg.type === 'transit'
                          ? `${seg.routeCode || seg.mode.toUpperCase()}: ${seg.routeName || ''}`
                          : 'Walk'}
                      </Text>
                      {seg.fare > 0 && (
                        <View style={styles.stepFareBadge}>
                          <Text style={styles.stepFareText}>₱{seg.fare}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.stepInstructions}>{seg.instructions}</Text>

                    <View style={styles.stepMetaRow}>
                      <Text style={styles.stepMetaText}>⏱ {seg.durationMinutes} min</Text>
                      <Text style={styles.stepMetaDot}>·</Text>
                      <Text style={styles.stepMetaText}>📏 {seg.distanceMeters}m</Text>
                      {seg.stopsCount && (
                        <>
                          <Text style={styles.stepMetaDot}>·</Text>
                          <Text style={styles.stepMetaText}>🚏 {seg.stopsCount} stops</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Sticky Footer with Start Trip Trigger */}
      <View style={[styles.footer, shadows.floating]}>
        <PrimaryButton
          title="START TRIP 🚀"
          onPress={() => onStartTrip(route)}
          size="lg"
          style={styles.startTripButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  mapWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  map: {
    borderRadius: borderRadius.lg,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeMainRow: {
    flex: 1,
  },
  timeMainText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeSubText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  fareTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fareTagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeStripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modeLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 3,
  },
  modeArrow: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 6,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  labelBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    marginRight: spacing.sm,
  },
  labelBadgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  summaryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineSection: {
    marginTop: spacing.sm,
  },
  timelineSectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: spacing.sm,
  },
  stepIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitBubble: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  walkingBubble: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  stepEmoji: {
    fontSize: 14,
  },
  stepDottedLine: {
    width: 2,
    height: 48,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stepContentCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  stepFareBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepFareText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  stepInstructions: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepMetaText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepMetaDot: {
    marginHorizontal: 4,
    color: colors.textMuted,
    fontSize: 10,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startTripButton: {
    width: '100%',
  },
});
