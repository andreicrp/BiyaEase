import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { MapView } from '../components/maps/MapView';
import { TransportCard } from '../components/routes/TransportCard';
import { transitApiService, ApiTransitStop } from '../services/transitApiService';
import { MapRegion } from '../utils/geoUtils';
import { NearbyTransport, TransitMode } from '../types/index';

interface NearbyScreenProps {
  onSelectTransport?: (item: NearbyTransport) => void;
  onOpenSearch?: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const NearbyScreen: React.FC<NearbyScreenProps> = ({
  onSelectTransport,
  onOpenSearch,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | TransitMode>('all');
  const [stops, setStops] = useState<ApiTransitStop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStop, setSelectedStop] = useState<ApiTransitStop | null>(null);
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'expanded'>('collapsed');

  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 14.6538,
    longitude: 121.0685,
    latitudeDelta: 0.045,
    longitudeDelta: 0.045,
  });

  const userLocation = { latitude: 14.6538, longitude: 121.0685 };

  const filterTabs: { key: 'all' | TransitMode; label: string; icon: string }[] = [
    { key: 'all', label: 'All Modes', icon: '📍' },
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
          3500
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
      // Collapse bottom sheet so user sees the focused map pin
      setSheetState('collapsed');
    }
    onSelectTransport?.(item);
  };

  const getSheetHeight = () => {
    if (sheetState === 'collapsed') return 80;
    if (sheetState === 'half') return Math.min(340, SCREEN_HEIGHT * 0.45);
    return Math.min(520, SCREEN_HEIGHT * 0.7);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Full-Screen Immersive Long Map (flex: 1) */}
      <View style={styles.mapWrapper}>
        <MapView
          height="100%"
          region={mapRegion}
          userLocation={userLocation}
          stops={filteredStops}
          selectedStop={selectedStop}
          onSelectStop={(stop) => {
            setSelectedStop(stop);
            if (stop) {
              setSheetState('collapsed');
            }
          }}
          onRegionChange={setMapRegion}
          showControls={true}
          style={styles.fullMap}
        />
      </View>

      {/* 2. Floating Top Origin/Destination Header & Mode Filters (Overlaid on Map) */}
      <View style={styles.topFloatingSection}>
        {/* Origin / Destination Search Card */}
        <TouchableOpacity
          style={[styles.searchPillCard, shadows.floating]}
          onPress={onOpenSearch}
          activeOpacity={0.9}
        >
          {/* Connector Dots */}
          <View style={styles.routeConnectorCol}>
            <View style={styles.originDot} />
            <View style={styles.connectorLine} />
            <View style={styles.destDot} />
          </View>

          {/* Input Labels */}
          <View style={styles.searchInputsCol}>
            <View style={styles.searchRowItem}>
              <Text style={styles.originText} numberOfLines={1}>
                Current Location (UP Diliman)
              </Text>
            </View>
            <View style={styles.searchDivider} />
            <View style={styles.searchRowItem}>
              <Text style={styles.destPlaceholder} numberOfLines={1}>
                Where to? (e.g. SM North, MRT, Philcoa)
              </Text>
            </View>
          </View>

          <View style={styles.swapIconBox}>
            <Text style={styles.swapIconText}>⇅</Text>
          </View>
        </TouchableOpacity>

        {/* Mode Filter Horizontal Bar */}
        <View style={styles.filterBarWrapper}>
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
                  style={[styles.filterPill, isSelected && styles.activeFilterPill, shadows.subtle]}
                  onPress={() => setSelectedFilter(tab.key)}
                  activeOpacity={0.7}
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

        {/* Live Loading Badge */}
        {isLoading && (
          <View style={[styles.loaderBadge, shadows.subtle]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loaderText}>Loading Metro Manila transit network...</Text>
          </View>
        )}
      </View>

      {/* 3. Floating Bottom Sheet Drawer for Transit Stops */}
      <View style={[styles.bottomSheet, { height: getSheetHeight() }, shadows.floating]}>
        {/* Drag Handle Bar */}
        <TouchableOpacity
          style={styles.sheetHandleArea}
          onPress={() => {
            setSheetState((prev) =>
              prev === 'collapsed' ? 'half' : prev === 'half' ? 'expanded' : 'collapsed'
            );
          }}
          activeOpacity={0.8}
        >
          <View style={styles.dragHandleBar} />

          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetTitleGroup}>
              <Text style={styles.sheetTitle}>
                🚏 Nearby Transit ({mappedNearbyList.length})
              </Text>
              <Text style={styles.sheetSubtitle}>
                {sheetState === 'collapsed'
                  ? 'Tap or swipe up to view stops'
                  : 'Tap stop to focus on map'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sheetToggleBtn}
              onPress={() => {
                setSheetState((prev) =>
                  prev === 'collapsed' ? 'half' : prev === 'half' ? 'expanded' : 'collapsed'
                );
              }}
            >
              <Text style={styles.sheetToggleText}>
                {sheetState === 'collapsed' ? '▲ Expand' : sheetState === 'half' ? '▲ Full' : '▼ Mini'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Stops List ScrollView when Expanded */}
        {sheetState !== 'collapsed' && (
          <ScrollView
            style={styles.stopsScroll}
            contentContainerStyle={styles.stopsScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
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
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8ECF0',
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  fullMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topFloatingSection: {
    position: 'absolute',
    top: 10,
    left: spacing.md,
    right: spacing.md,
    zIndex: 30,
    pointerEvents: 'box-none',
  },
  searchPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: spacing.xs,
  },
  routeConnectorCol: {
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingVertical: 2,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    backgroundColor: '#FFFFFF',
  },
  connectorLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.textMuted,
    marginVertical: 2,
  },
  destDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  searchInputsCol: {
    flex: 1,
  },
  searchRowItem: {
    paddingVertical: 2,
  },
  originText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  destPlaceholder: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  swapIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  swapIconText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  filterBarWrapper: {
    marginTop: spacing.xs,
  },
  filterScroll: {
    gap: spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
  loaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  loaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    zIndex: 40,
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  sheetHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitleGroup: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  sheetToggleBtn: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  sheetToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  stopsScroll: {
    flex: 1,
  },
  stopsScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.cardAlt,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
});
