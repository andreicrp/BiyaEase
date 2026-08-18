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
import { MapView } from '../components/maps/MapView';
import { TransportCard } from '../components/routes/TransportCard';
import { transitApiService, ApiTransitStop } from '../services/transitApiService';
import { MapRegion } from '../utils/geoUtils';
import { NearbyTransport, TransitMode } from '../types/index';

interface NearbyScreenProps {
  onSelectTransport?: (item: NearbyTransport) => void;
}

export const NearbyScreen: React.FC<NearbyScreenProps> = ({ onSelectTransport }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | TransitMode>('all');
  const [stops, setStops] = useState<ApiTransitStop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStop, setSelectedStop] = useState<ApiTransitStop | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 14.6538,
    longitude: 121.0685,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  });

  const userLocation = { latitude: 14.6538, longitude: 121.0685 };

  const filterTabs: { key: 'all' | TransitMode; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📍' },
    { key: 'jeepney', label: 'Jeepney', icon: '🚐' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'mrt', label: 'MRT', icon: '🚆' },
    { key: 'lrt', label: 'LRT', icon: '🚈' },
    { key: 'uvexpress', label: 'UV', icon: '🚐' },
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadStops() {
      setIsLoading(true);
      try {
        const data = await transitApiService.getNearbyStops(
          userLocation.latitude,
          userLocation.longitude,
          3000
        );
        if (isMounted) {
          setStops(data);
        }
      } catch (err) {
        console.warn('Failed to load nearby stops:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStops();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStops =
    selectedFilter === 'all'
      ? stops
      : stops.filter((s) => {
          const m = (s.mode || '').toLowerCase();
          return m.includes(selectedFilter.toLowerCase());
        });

  // Convert ApiTransitStop to NearbyTransport format for TransportCard
  const mappedNearbyList: NearbyTransport[] = filteredStops.map((s) => ({
    id: s.id,
    mode: (s.mode as TransitMode) || 'bus',
    routeName: s.code || 'Transit Corridor',
    heading: s.description || 'Connecting Metro Manila Lines',
    distanceMeters: s.distance_meters || 250,
    etaMinutes: Math.max(1, Math.round((s.distance_meters || 250) / 100)),
    stopName: s.name,
    coordinates: {
      latitude: s.latitude,
      longitude: s.longitude,
    },
  }));

  const handleSelectFromList = (item: NearbyTransport) => {
    const matchedStop = stops.find((s) => s.id === item.id);
    if (matchedStop) {
      setSelectedStop(matchedStop);
      setMapRegion({
        latitude: matchedStop.latitude,
        longitude: matchedStop.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }
    onSelectTransport?.(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Nearby Public Transit"
        subtitle="Live PostGIS Stations & Terminals"
        rightAction={
          <TouchableOpacity
            style={styles.expandTogglePill}
            onPress={() => setIsMapExpanded((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityLabel={isMapExpanded ? 'Collapse map' : 'Expand full map'}
          >
            <Text style={styles.expandToggleIcon}>{isMapExpanded ? '📋' : '🗺️'}</Text>
            <Text style={styles.expandToggleText}>
              {isMapExpanded ? 'Show List' : 'Full Map'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Real Interactive MapView with Expand/Collapse Height */}
        <View style={[styles.mapContainer, isMapExpanded && styles.mapContainerExpanded]}>
          <MapView
            height={isMapExpanded ? 460 : 260}
            region={mapRegion}
            userLocation={userLocation}
            stops={filteredStops}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            onRegionChange={setMapRegion}
            showControls={true}
            style={styles.map}
          />

          {/* Map Controls & Status Overlays */}
          <View style={styles.mapOverlayHeader}>
            {isLoading && (
              <View style={styles.loaderBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loaderText}>Querying PostGIS ST_DWithin...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.mapResizeButton}
              onPress={() => setIsMapExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.mapResizeText}>
                {isMapExpanded ? '⤡ Compact View' : '⤢ Expand Map'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Filter Bar */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterTabs.map((tab) => {
              const isSelected = selectedFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                  onPress={() => setSelectedFilter(tab.key)}
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

        {/* Nearby Stations List Section */}
        <View style={styles.stopsSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              NEARBY TRANSIT STOPS ({mappedNearbyList.length})
            </Text>
            <Text style={styles.sectionSubtitle}>Tap a stop to focus on map</Text>
          </View>

          {mappedNearbyList.length === 0 && !isLoading && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No stops found for this filter radius.</Text>
            </View>
          )}

          {mappedNearbyList.map((item) => (
            <TransportCard
              key={item.id}
              item={item}
              onPress={() => handleSelectFromList(item)}
            />
          ))}
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
  expandTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  expandToggleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  expandToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: spacing.huge,
  },
  mapContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapContainerExpanded: {
    height: 460,
  },
  map: {
    borderRadius: 0,
  },
  mapOverlayHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  loaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  loaderText: {
    fontSize: typography.fontSize.xxs,
    color: colors.primaryDark,
    fontWeight: '700',
    marginLeft: 6,
  },
  mapResizeButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  mapResizeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
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
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pillIcon: {
    fontSize: 12,
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
  stopsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
});
