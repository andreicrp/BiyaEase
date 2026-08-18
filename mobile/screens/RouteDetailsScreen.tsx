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
      
      const stopsData: ApiTransitStop[] = [
        {
          id: 'step-stop-0',
          name: legacyOption.steps[0]?.originStop || 'UP Diliman Campus',
          code: 'BOARD-1',
          latitude: 14.6538,
          longitude: 121.0685,
          mode: 'jeepney',
        },
        {
          id: 'step-stop-1',
          name: 'Philcoa Terminal / Commonwealth',
          code: 'TRANSFER',
          latitude: 14.6542,
          longitude: 121.0535,
          mode: 'jeepney',
        },
        {
          id: 'step-stop-2',
          name: legacyOption.steps[legacyOption.steps.length - 1]?.destinationStop || 'SM North EDSA Terminal',
          code: 'ALIGHT',
          latitude: 14.6565,
          longitude: 121.0288,
          mode: 'bus',
        },
      ];

      setRouteCoordinates(interpolateRoadCorridor(fallbackPoints));
      setRouteStops(stopsData);
    }
  }, [journey, legacyOption]);

  const polyline: MapPolylineItem = React.useMemo(
    () => ({
      id: `poly-${journey?.id || legacyOption?.id || 'route'}`,
      coordinates: interpolateRoadCorridor(routeCoordinates),
      color: colors.primary,
      strokeWidth: 5,
    }),
    [journey?.id, legacyOption?.id, routeCoordinates]
  );

  const getModeEmoji = (mode: JourneyMode | string): string => {
    switch (mode) {
      case 'jeepney':
        return '🚐';
      case 'mrt':
        return '🚆';
      case 'lrt':
        return '🚈';
      case 'bus':
        return '🚌';
      case 'uvexpress':
        return '🚐';
      case 'tricycle':
        return '🛺';
      default:
        return '🚶';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Route Details" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Real Map Visualization with Route Polyline and Sequenced Stops */}
        <View style={styles.mapWrapper}>
          <MapView
            height={220}
            polylines={[polyline]}
            stops={routeStops}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            fitCoordinates={polyline.coordinates}
            showControls={true}
            style={styles.map}
          />
        </View>

        {/* Route Summary Metrics Card */}
        <View style={[styles.summaryCard, shadows.card]}>
          <View style={styles.badgeRow}>
            <View style={styles.labelBadge}>
              <Text style={styles.labelBadgeText}>{labelText}</Text>
            </View>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {summaryTitle}
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>EST. DURATION</Text>
              <TimeBadge durationMinutes={durationMinutes} size="lg" />
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TOTAL FARE</Text>
              <FareBadge fare={totalFare} size="lg" variant="solid" />
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TRANSFERS</Text>
              <Text style={styles.metricValue}>
                {transfersCount === 0 ? 'Direct' : `${transfersCount} transfer`}
              </Text>
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
