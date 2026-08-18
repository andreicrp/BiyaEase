import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
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
import { SearchBar } from '../components/common/SearchBar';
import { searchApiService } from '../services/searchApiService';
import { locationService } from '../services/locationService';
import { SearchResult, SelectedLocation, RecentSearchItem } from '../types/search.types';
import { Destination } from '../types/index';

interface SearchScreenProps {
  mode?: 'destination' | 'origin';
  onBack: () => void;
  onSelectDestination: (destination: Destination | SelectedLocation) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  mode = 'destination',
  onBack,
  onSelectDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    searchApiService.getRecentSearches().then(setRecentSearches);
  }, []);

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = text.trim();

    if (trimmed.length === 0) {
      setIsSearching(false);
      setResults([]);
      return;
    }

    // Debounce search by 300ms
    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchApiService.searchLocations(trimmed, {
          lat: 14.6538,
          lng: 121.0685,
          limit: 25,
        });
        setResults(data);
      } catch (err) {
        console.warn('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectLocation = async (item: SearchResult | RecentSearchItem) => {
    const selected: SelectedLocation = {
      id: item.id,
      name: item.name,
      type: item.type,
      latitude: item.latitude,
      longitude: item.longitude,
      subtitle: item.subtitle,
    };

    if (mode === 'origin') {
      locationService.setCustomLocation(item.latitude, item.longitude, item.name);
    } else {
      await searchApiService.saveRecentSearch(selected);
    }
    onSelectDestination(selected);
  };

  const handleSelectCurrentLocation = async () => {
    locationService.resetToGps();
    const gpsLoc = await locationService.getCurrentLocation();
    const currentLoc: SelectedLocation = {
      id: 'current-location',
      name: 'Current Location',
      type: 'place',
      latitude: gpsLoc?.latitude ?? 14.6538,
      longitude: gpsLoc?.longitude ?? 121.0685,
      subtitle: 'Live Device GPS',
    };
    onSelectDestination(currentLoc);
  };

  const handleClearRecent = async () => {
    await searchApiService.clearRecentSearches();
    setRecentSearches([]);
  };

  // Group results by category
  const placeResults = results.filter((r) => r.type === 'place');
  const stopResults = results.filter((r) => r.type === 'stop' || r.type === 'station');
  const routeResults = results.filter((r) => r.type === 'route');

  const getResultIcon = (item: SearchResult): string => {
    if (item.type === 'station') {
      const m = (item.mode || '').toLowerCase();
      if (m.includes('mrt')) return '🚆';
      if (m.includes('lrt')) return '🚈';
      return '🚉';
    }
    if (item.type === 'stop') {
      const m = (item.mode || '').toLowerCase();
      if (m.includes('jeep')) return '🚐';
      if (m.includes('bus')) return '🚌';
      if (m.includes('uv')) return '🚐';
      if (m.includes('trik')) return '🛺';
      return '🚏';
    }
    if (item.type === 'route') return '🗺️';

    const cat = (item.category || '').toLowerCase();
    if (cat.includes('mall') || cat.includes('shop')) return '🛍️';
    if (cat.includes('uni') || cat.includes('school')) return '🎓';
    if (cat.includes('gov')) return '🏛️';
    if (cat.includes('work') || cat.includes('office') || cat.includes('comm')) return '🏢';
    return '📍';
  };

  const originDisplayName = locationService.getLocationName();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={mode === 'origin' ? 'Edit Starting Origin' : 'Search Destination'}
        onBack={onBack}
      />

      {/* Top Search Input Box */}
      <View style={styles.searchSection}>
        {/* Origin Pill (Fixed to Current Location) */}
        <TouchableOpacity
          style={styles.originRow}
          onPress={handleSelectCurrentLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.originIcon}>📍</Text>
          <Text style={styles.originLabel}>
            {mode === 'origin' ? 'Use Device GPS:' : 'Starting Origin:'}
          </Text>
          <Text style={styles.originValue} numberOfLines={1}>
            {originDisplayName}
          </Text>
        </TouchableOpacity>

        {/* Live Search Input with Clear Button */}
        <SearchBar
          value={searchQuery}
          onChangeText={handleQueryChange}
          placeholder={
            mode === 'origin'
              ? 'Search origin (e.g. SM North, Cubao, Philcoa)'
              : 'Where to? (e.g. SM North, UP, MRT-3, Philcoa)'
          }
          autoFocus={true}
          onClear={() => handleQueryChange('')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Indicator */}
        {isSearching && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Searching locations & transit stops...</Text>
          </View>
        )}

        {/* 1. Recent Searches (Shown when query is empty) */}
        {!searchQuery.trim() && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
              <TouchableOpacity
                onPress={handleClearRecent}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map((item) => (
              <TouchableOpacity
                key={`recent-${item.id}`}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => handleSelectLocation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>⏱</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle || 'Recent location'}
                  </Text>
                </View>
                <Text style={styles.selectArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 2. Categorized Places & Landmarks */}
        {placeResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PLACES & LANDMARKS ({placeResults.length})</Text>
            {placeResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => handleSelectLocation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{getResultIcon(item)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                {item.distanceMeters !== undefined && (
                  <View style={styles.distancePill}>
                    <Text style={styles.distancePillText}>
                      {item.distanceMeters >= 1000
                        ? `${(item.distanceMeters / 1000).toFixed(1)} km`
                        : `${Math.round(item.distanceMeters)} m`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. Categorized Transit Stops & Stations */}
        {stopResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRANSIT STOPS & STATIONS ({stopResults.length})</Text>
            {stopResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => handleSelectLocation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{getResultIcon(item)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                {item.distanceMeters !== undefined && (
                  <View style={styles.distancePill}>
                    <Text style={styles.distancePillText}>
                      {item.distanceMeters >= 1000
                        ? `${(item.distanceMeters / 1000).toFixed(1)} km`
                        : `${Math.round(item.distanceMeters)} m`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 4. Categorized Transit Routes */}
        {routeResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              TRANSIT ROUTES & CORRIDORS ({routeResults.length})
            </Text>
            {routeResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => handleSelectLocation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{getResultIcon(item)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>ROUTE</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 5. Useful Empty State with Search Tips */}
        {searchQuery.trim().length >= 2 && results.length === 0 && !isSearching && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No locations found for "{searchQuery}"</Text>
            <Text style={styles.emptyDesc}>Try searching with these suggestions:</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Check for correct spelling</Text>
              <Text style={styles.tipItem}>
                • Search for popular landmarks: "SM North", "UP", "Trinoma"
              </Text>
              <Text style={styles.tipItem}>
                • Search for stations: "MRT", "LRT", "Cubao", "Katipunan"
              </Text>
              <Text style={styles.tipItem}>
                • Search for transit corridors: "Philcoa", "EDSA", "Fairview"
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  originIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  originLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 4,
  },
  originValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
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
    marginBottom: spacing.sm,
  },
  clearText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '700',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  distancePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  distancePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  routeBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  routeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tipsList: {
    width: '100%',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 4,
  },
  tipItem: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
