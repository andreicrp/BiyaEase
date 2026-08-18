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
import { spacing, borderRadius } from '../constants/spacing';
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
      <AppHeader title="Nearby Public Transit" subtitle="Live PostGIS Stations & Terminals" />

      {/* Real Interactive MapView */}
      <View style={styles.mapContainer}>
        <MapView
          height={240}
          region={mapRegion}
          userLocation={userLocation}
          stops={filteredStops}
          selectedStop={selectedStop}
          onSelectStop={setSelectedStop}
          onRegionChange={setMapRegion}
          showControls={true}
          style={styles.map}
        />
        {isLoading && (
          <View style={styles.loaderBadge}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loaderText}>Querying PostGIS ST_DWithin...</Text>
          </View>
        )}
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

      {/* Nearby Stations List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>NEARBY TRANSIT STOPS ({mappedNearbyList.length})</Text>

        {mappedNearbyList.length === 0 && !isLoading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No stops found for this filter radius.</Text>
          </View>
        )}

        {mappedNearbyList.map((item) => (
          <TransportCard key={item.id} item={item} onPress={() => handleSelectFromList(item)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#E2E8F0',
  },
  map: {
    borderRadius: 0,
  },
  loaderBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loaderText: {
    fontSize: typography.fontSize.xxs,
    color: colors.primaryDark,
    fontWeight: '700',
    marginLeft: 6,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
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
