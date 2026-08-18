import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo } from 'react';
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
import { Destination } from '../types/index';
import { SelectedLocation } from '../types/search.types';
import { Journey, JourneyMode, RouteRecommendation } from '../types/routing.types';
import { routingApiService } from '../services/routingApiService';

interface RouteOptionsScreenProps {
  origin?:
    | Destination
    | SelectedLocation
    | string
    | { latitude: number; longitude: number; name?: string };
  destination: Destination | SelectedLocation | string;
  onBack: () => void;
  onSelectRoute: (journey: Journey) => void;
  onEditOrigin?: () => void;
}

type SortOption = 'recommended' | 'fastest' | 'cheapest' | 'least_walking' | 'fewest_transfers';
type ModeFilterOption = 'all' | JourneyMode;

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

function formatFare(fare: number): string {
  if (fare === 0) return 'Free';
  return `₱${fare}`;
}

function formatWalkDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

import { useSavedData } from '../context/SavedDataContext';
import { Modal, TextInput, Alert } from 'react-native';

const RNTouchableOpacity = TouchableOpacity as any;
const RNModal = Modal as any;
const RNTextInput = TextInput as any;

export const RouteOptionsScreen: React.FC<RouteOptionsScreenProps> = ({
  origin = 'UP Diliman',
  destination,
  onBack,
  onSelectRoute,
  onEditOrigin: _onEditOrigin,
}) => {
  const { favoriteRoutes: _favoriteRoutes, saveRoute } = useSavedData();
  const [saveModalJourney, setSaveModalJourney] = useState<Journey | null>(null);
  const [customRouteName, setCustomRouteName] = useState<string>('');

  const originName = typeof origin === 'string' ? origin : origin.name || 'Current Location';
  const originCoords =
    typeof origin === 'object' && (origin as any).latitude
      ? { latitude: (origin as any).latitude, longitude: (origin as any).longitude }
      : { latitude: 14.6538, longitude: 121.0685 };

  const destinationName = typeof destination === 'string' ? destination : destination.name;
  const destinationCoords =
    typeof destination === 'object' && (destination as any).latitude
      ? { latitude: (destination as any).latitude, longitude: (destination as any).longitude }
      : { latitude: 14.6565, longitude: 121.0288 };

  const [modeFilter, setModeFilter] = useState<ModeFilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [routes, setRoutes] = useState<Journey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRoutes = () => {
    setLoading(true);
    setErrorMsg(null);

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
        setRoutes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Routing search error:', err);
        setErrorMsg('Unable to connect to the transit routing engine. Please retry.');
        setRoutes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRoutes();
  }, [
    destinationCoords.latitude,
    destinationCoords.longitude,
    destinationName,
    originCoords.latitude,
    originCoords.longitude,
    originName,
  ]);

  const handleOpenSaveModal = (journey: Journey) => {
    setSaveModalJourney(journey);
    setCustomRouteName(`${originName} ➔ ${destinationName}`);
  };

  const handleConfirmSaveRoute = async () => {
    if (!saveModalJourney || !customRouteName.trim()) return;

    const res = await saveRoute({
      name: customRouteName.trim(),
      origin: {
        id: 'origin',
        name: originName,
        latitude: originCoords.latitude,
        longitude: originCoords.longitude,
      },
      destination: {
        id: 'dest',
        name: destinationName,
        latitude: destinationCoords.latitude,
        longitude: destinationCoords.longitude,
      },
      journeyId: saveModalJourney.id,
      modeSummary: saveModalJourney.modes.map((m) => m.toUpperCase()),
      routeSummary: saveModalJourney.summary,
      estimatedDurationMinutes: saveModalJourney.durationMinutes,
      estimatedFare: saveModalJourney.fare,
    });

    if (res.success) {
      Alert.alert(
        'Route Saved! ⭐',
        `"${customRouteName}" has been saved to your Favorite Routes.`
      );
      setSaveModalJourney(null);
    } else {
      Alert.alert('Error', res.error || 'Failed to save route');
    }
  };

  const modeFilterTabs: { key: ModeFilterOption; label: string; icon: string }[] = [
    { key: 'all', label: 'All Modes', icon: '🗺️' },
    { key: 'jeepney', label: 'Jeepney', icon: '🚐' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'mrt', label: 'MRT', icon: '🚆' },
    { key: 'lrt', label: 'LRT', icon: '🚈' },
    { key: 'uvexpress', label: 'UV', icon: '🚐' },
    { key: 'walking', label: 'Walking', icon: '🚶' },
  ];

  const sortChips: { key: SortOption; label: string; icon: string }[] = [
    { key: 'recommended', label: 'Recommended', icon: '⭐' },
    { key: 'fastest', label: 'Fastest', icon: '⚡' },
    { key: 'cheapest', label: 'Cheapest', icon: '💰' },
    { key: 'least_walking', label: 'Least Walking', icon: '🚶' },
    { key: 'fewest_transfers', label: 'Fewest Transfers', icon: '↔' },
  ];

  // 1. Client-Side Mode Filtering & Sorting (instant responsiveness)
  const processedRoutes = useMemo(() => {
    // Mode filter
    let filtered = routes;
    if (modeFilter !== 'all') {
      filtered = routes.filter((r) => r.modes.includes(modeFilter));
    }

    // Sort order
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortOption === 'fastest') {
        if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes;
        return a.transfers - b.transfers;
      }
      if (sortOption === 'cheapest') {
        if (a.fare !== b.fare) return a.fare - b.fare;
        return a.durationMinutes - b.durationMinutes;
      }
      if (sortOption === 'least_walking') {
        if (a.walkingDistanceMeters !== b.walkingDistanceMeters)
          return a.walkingDistanceMeters - b.walkingDistanceMeters;
        return a.durationMinutes - b.durationMinutes;
      }
      if (sortOption === 'fewest_transfers') {
        if (a.transfers !== b.transfers) return a.transfers - b.transfers;
        return a.durationMinutes - b.durationMinutes;
      }

      // Default: Recommended
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes;
      return a.fare - b.fare;
    });

    return sorted;
  }, [routes, modeFilter, sortOption]);

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

  const getRecommendationBadgeLabel = (rec: RouteRecommendation): string => {
    switch (rec) {
      case 'fastest':
        return 'FASTEST';
      case 'cheapest':
        return 'CHEAPEST';
      case 'least_walking':
        return 'LESS WALKING';
      case 'fewest_transfers':
        return 'FEWEST TRANSFERS';
      default:
        return 'BEST ROUTE';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Commute Route Options" onBack={onBack} />

      {/* Origin -> Destination Trip Header Card */}
      <View style={styles.tripSummaryHeader}>
        <View style={styles.endpointRow}>
          <Text style={styles.originDot}>🟢</Text>
          <Text style={styles.endpointText} numberOfLines={1}>
            {originName}
          </Text>
        </View>
        <View style={styles.connectorRow}>
          <Text style={styles.connectorArrow}>↓</Text>
        </View>
        <View style={styles.endpointRow}>
          <Text style={styles.destDot}>📍</Text>
          <Text style={styles.endpointText} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
      </View>

      {/* Mode Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {modeFilterTabs.map((tab) => {
            const isSelected = modeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                onPress={() => setModeFilter(tab.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tab.label}`}
              >
                <Text style={styles.pillIcon}>{tab.icon}</Text>
                <Text style={[styles.pillLabel, isSelected && styles.activePillLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sorting Control Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortCaption}>SORT BY:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          {sortChips.map((chip) => {
            const isSelected = sortOption === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.sortChip, isSelected && styles.activeSortChip]}
                onPress={() => setSortOption(chip.key)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${chip.label}`}
              >
                <Text style={styles.sortIcon}>{chip.icon}</Text>
                <Text style={[styles.sortLabel, isSelected && styles.activeSortLabel]}>
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
          <Text style={styles.loadingTitle}>Comparing transit options...</Text>
          <Text style={styles.loadingSubtitle}>
            Evaluating Philippine jeepneys, buses, trains & walking corridors
          </Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Routing Service Error</Text>
          <Text style={styles.emptySubtitle}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRoutes}>
            <Text style={styles.retryButtonText}>🔄 Retry Route Search</Text>
          </TouchableOpacity>
        </View>
      ) : processedRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No routes found</Text>
          <Text style={styles.emptySubtitle}>
            Try selecting a nearby transit station, landmark, or increasing your walking radius.
          </Text>
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>Suggestions:</Text>
            <Text style={styles.suggestionItem}>• Try selecting "All Modes" filter</Text>
            <Text style={styles.suggestionItem}>• Choose a major terminal or mall</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            Found {processedRoutes.length} practical commute option
            {processedRoutes.length > 1 ? 's' : ''}
          </Text>

          {processedRoutes.map((journey) => {
            const recommendations = journey.recommendations || [];
            const durationText = formatDuration(journey.durationMinutes);
            const fareText = formatFare(journey.fare);
            const walkText = formatWalkDistance(journey.walkingDistanceMeters);
            const transferText =
              journey.transfers === 0
                ? 'Direct'
                : `${journey.transfers} transfer${journey.transfers > 1 ? 's' : ''}`;
            const modesText = journey.modes.map((m) => m.toUpperCase()).join(', ');

            const a11yLabel = `${
              journey.label ? `${journey.label} route. ` : ''
            }${durationText}. ${fareText}. ${walkText} walking. ${transferText}. Transit modes: ${modesText}.`;

            return (
              <TouchableOpacity
                key={journey.id}
                style={[styles.journeyCard, shadows.medium]}
                onPress={() => onSelectRoute(journey)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
              >
                {/* 1. Recommendation Badges Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    {recommendations.length > 0 ? (
                      recommendations.map((rec) => (
                        <View
                          key={`rec-${journey.id}-${rec}`}
                          style={[
                            styles.labelBadge,
                            rec === 'fastest'
                              ? styles.badgeFastest
                              : rec === 'cheapest'
                                ? styles.badgeCheapest
                                : styles.badgeDefault,
                          ]}
                        >
                          <Text style={styles.labelText}>{getRecommendationBadgeLabel(rec)}</Text>
                        </View>
                      ))
                    ) : journey.label ? (
                      <View style={[styles.labelBadge, styles.badgeDefault]}>
                        <Text style={styles.labelText}>{journey.label}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Fare Badge */}
                  <View style={styles.fareContainer}>
                    <Text style={styles.fareText}>{fareText}</Text>
                  </View>
                </View>

                {/* 2. Duration & Metrics Row */}
                <View style={styles.metricsRow}>
                  <Text style={styles.durationText}>{durationText}</Text>
                  <Text style={styles.dotSeparator}>·</Text>
                  <Text style={styles.metricText}>🚶 {walkText} walk</Text>
                  <Text style={styles.dotSeparator}>·</Text>
                  <Text style={styles.metricText}>↔ {transferText}</Text>
                </View>

                {/* 3. Mode Sequence & Route Code Chain */}
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
                        {seg.routeCode ? (
                          <Text style={styles.routeCodeMini}>{seg.routeCode}</Text>
                        ) : (
                          <Text style={styles.modeMini}>
                            {seg.mode === 'walking' ? 'Walk' : ''}
                          </Text>
                        )}
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {/* 4. Action Hint & Save Route Button */}
                <View style={styles.cardFooter}>
                  <Text style={styles.summaryText} numberOfLines={1}>
                    {journey.summary}
                  </Text>
                  <RNTouchableOpacity
                    style={styles.saveRouteBtn}
                    onPress={(e: any) => {
                      e.stopPropagation();
                      handleOpenSaveModal(journey);
                    }}
                  >
                    <Text style={styles.saveRouteBtnText}>⭐ Save Route</Text>
                  </RNTouchableOpacity>
                  <Text style={styles.viewRouteLink}>View Details ➔</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Save Route Modal */}
      <RNModal
        visible={!!saveModalJourney}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveModalJourney(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogModalContainer}>
            <Text style={styles.dialogTitle}>Save Favorite Route ⭐</Text>
            <Text style={styles.dialogSub}>
              Save this commute option for 1-tap route recalculation.
            </Text>

            <Text style={styles.fieldLabel}>CUSTOM ROUTE NAME</Text>
            <RNTextInput
              style={styles.textInput}
              value={customRouteName}
              onChangeText={setCustomRouteName}
              placeholder="e.g. Daily Commute, School Route"
            />

            <View style={styles.dialogActions}>
              <RNTouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSaveModalJourney(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.saveBtn} onPress={handleConfirmSaveRoute}>
                <Text style={styles.saveBtnText}>Save Favorite Route</Text>
              </RNTouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
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
  originDot: {
    fontSize: 10,
    marginRight: spacing.sm,
  },
  destDot: {
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
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  pillLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activePillLabel: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: spacing.sm,
    letterSpacing: 0.5,
  },
  sortScroll: {
    gap: spacing.xs,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.cardAlt,
  },
  activeSortChip: {
    backgroundColor: colors.primaryLight,
  },
  sortIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  sortLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeSortLabel: {
    color: colors.primaryDark,
    fontWeight: '800',
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
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  labelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeFastest: {
    backgroundColor: '#FEF3C7',
  },
  badgeCheapest: {
    backgroundColor: '#D1FAE5',
  },
  badgeDefault: {
    backgroundColor: colors.primaryLight,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
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
    marginBottom: spacing.sm,
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
    marginBottom: spacing.sm,
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
    fontWeight: '800',
    color: colors.primaryDark,
    marginLeft: 4,
  },
  modeMini: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  saveRouteBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginRight: spacing.xs,
  },
  saveRouteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  dialogModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    padding: spacing.lg,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.cardAlt,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryText: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  viewRouteLink: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
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
  suggestionBox: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  suggestionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  suggestionItem: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: typography.fontSize.xs,
  },
});
