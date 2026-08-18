import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { Destination, RouteFilterCategory } from '../types/index';
import { SelectedLocation } from '../types/search.types';
import { Journey, JourneyMode } from '../types/routing.types';
import { routingApiService } from '../services/routingApiService';

interface RouteOptionsScreenProps {
  origin?: string | { latitude: number; longitude: number; name?: string };
  destination: Destination | SelectedLocation | string;
  onBack: () => void;
  onSelectRoute: (journey: Journey) => void;
}

export const RouteOptionsScreen: React.FC<RouteOptionsScreenProps> = ({
  origin = 'UP Diliman',
  destination,
  onBack,
  onSelectRoute,
}) => {
  const originName = typeof origin === 'string' ? origin : origin.name || 'Current Location';
  const originCoords =
    typeof origin === 'object' && origin.latitude
      ? { latitude: origin.latitude, longitude: origin.longitude }
      : { latitude: 14.6538, longitude: 121.0685 };

  const destinationName = typeof destination === 'string' ? destination : destination.name;

  const destinationCoords =
    typeof destination === 'object' && 'latitude' in destination
      ? { latitude: destination.latitude, longitude: destination.longitude }
      : { latitude: 14.6565, longitude: 121.0288 };

  const [filter, setFilter] = useState<RouteFilterCategory>('all');
  const [routes, setRoutes] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    routingApiService
      .searchRoutes({
        origin: {
          latitude: originCoords.latitude,
          longitude: originCoords.longitude,
          name: originName,
        },
        destination: {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude,
          name: destinationName,
        },
        maxWalkingDistanceMeters: 1000,
        maxTransfers: 3,
        limit: 8,
      })
      .then((data) => {
        if (isMounted) {
          setRoutes(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Routing search error:', err);
        if (isMounted) {
          setRoutes([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    destinationCoords.latitude,
    destinationCoords.longitude,
    destinationName,
    originCoords.latitude,
    originCoords.longitude,
    originName,
  ]);

  const filterChips: { key: RouteFilterCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All Routes', icon: '🗺️' },
    { key: 'fastest', label: 'Fastest', icon: '⚡' },
    { key: 'cheapest', label: 'Cheapest', icon: '💰' },
    { key: 'less_walking', label: 'Less Walking', icon: '🚶' },
    { key: 'fewer_transfers', label: 'Fewer Transfers', icon: '🔄' },
  ];

  // Filter routes based on active category
  const filteredRoutes = routes.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'fastest') return r.label === 'FASTEST' || r.isRecommended;
    if (filter === 'cheapest') return r.label === 'CHEAPEST' || r.fare <= 15;
    if (filter === 'less_walking')
      return r.label === 'LESS WALKING' || r.walkingDistanceMeters <= 500;
    if (filter === 'fewer_transfers') return r.label === 'FEWER TRANSFERS' || r.transfers === 0;
    return true;
  });

  const getModeEmoji = (mode: JourneyMode): string => {
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
      <AppHeader title="Commute Route Options" onBack={onBack} />

      {/* Origin -> Destination Trip Header Bar */}
      <View style={styles.tripSummaryHeader}>
        <View style={styles.endpointRow}>
          <Text style={styles.endpointDot}>🟢</Text>
          <Text style={styles.endpointText} numberOfLines={1}>
            {originName}
          </Text>
        </View>
        <View style={styles.connectorRow}>
          <Text style={styles.connectorArrow}>↓</Text>
        </View>
        <View style={styles.endpointRow}>
          <Text style={styles.endpointDot}>📍</Text>
          <Text style={styles.endpointText} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
      </View>

      {/* Filter Category Chips */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = filter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                onPress={() => setFilter(chip.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipIcon}>{chip.icon}</Text>
                <Text style={[styles.chipLabel, isSelected && styles.activeChipLabel]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Routes List Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Finding the best routes...</Text>
          <Text style={styles.loadingSubtitle}>
            Analyzing Philippine jeepneys, buses, trains & walking corridors
          </Text>
        </View>
      ) : filteredRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No feasible routes found</Text>
          <Text style={styles.emptySubtitle}>
            Try selecting a nearby transit station, landmark, or increasing your walking distance.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            Found {filteredRoutes.length} practical commute options
          </Text>

          {filteredRoutes.map((journey) => (
            <TouchableOpacity
              key={journey.id}
              style={[styles.journeyCard, shadows.subtle]}
              onPress={() => onSelectRoute(journey)}
              activeOpacity={0.8}
            >
              {/* Badge & Fare Top Row */}
              <View style={styles.cardHeader}>
                {journey.label ? (
                  <View
                    style={[
                      styles.labelBadge,
                      journey.label === 'FASTEST'
                        ? styles.badgeFastest
                        : journey.label === 'CHEAPEST'
                          ? styles.badgeCheapest
                          : styles.badgeDefault,
                    ]}
                  >
                    <Text style={styles.labelText}>{journey.label}</Text>
                  </View>
                ) : (
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{journey.summary}</Text>
                  </View>
                )}

                <View style={styles.fareContainer}>
                  <Text style={styles.fareText}>₱{journey.fare}</Text>
                </View>
              </View>

              {/* Duration & Route Summary */}
              <View style={styles.metricsRow}>
                <Text style={styles.durationText}>{journey.durationMinutes} min</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <Text style={styles.metricText}>
                  {journey.walkingDistanceMeters >= 1000
                    ? `${(journey.walkingDistanceMeters / 1000).toFixed(1)} km walking`
                    : `${journey.walkingDistanceMeters}m walking`}
                </Text>
                <Text style={styles.dotSeparator}>·</Text>
                <Text style={styles.metricText}>
                  {journey.transfers === 0
                    ? 'Direct'
                    : `${journey.transfers} transfer${journey.transfers > 1 ? 's' : ''}`}
                </Text>
              </View>

              {/* Mode Sequence Chain */}
              <View style={styles.modeChainRow}>
                {journey.segments.map((seg, idx) => (
                  <React.Fragment key={`seg-${journey.id}-${idx}`}>
                    {idx > 0 && <Text style={styles.chainArrow}>→</Text>}
                    <View
                      style={[
                        styles.modeIconBox,
                        seg.type === 'transit' ? styles.transitIconBox : styles.walkIconBox,
                      ]}
                    >
                      <Text style={styles.modeEmoji}>{getModeEmoji(seg.mode)}</Text>
                      {seg.routeCode && <Text style={styles.routeCodeMini}>{seg.routeCode}</Text>}
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tripSummaryHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endpointDot: {
    fontSize: 12,
    marginRight: spacing.sm,
  },
  endpointText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  connectorRow: {
    paddingLeft: 18,
    marginVertical: -2,
  },
  connectorArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  filterBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  chipLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeChipLabel: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultsCount: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  badgeFastest: {
    backgroundColor: '#FEF3C7',
  },
  badgeCheapest: {
    backgroundColor: '#D1FAE5',
  },
  badgeDefault: {
    backgroundColor: colors.cardAlt,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  summaryPill: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  summaryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fareContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  fareText: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  durationText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dotSeparator: {
    marginHorizontal: spacing.xs,
    color: colors.textMuted,
    fontSize: 14,
  },
  metricText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeChainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chainArrow: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modeIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  transitIconBox: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
  },
  walkIconBox: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  modeEmoji: {
    fontSize: 13,
  },
  routeCodeMini: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
