import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { SearchBar } from '../components/common/SearchBar';
import { EmptyState } from '../components/common/EmptyState';
import { transitApiService } from '../services/transitApiService';
import { MockTransitService } from '../services/mockTransitService';
import { Destination } from '../types/index';

interface SearchScreenProps {
  onBack: () => void;
  onSelectDestination: (destination: Destination) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onBack, onSelectDestination }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Destination[]>([]);
  const [recentSearches, setRecentSearches] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    MockTransitService.getRecentSearches().then(setRecentSearches);
    MockTransitService.getPopularDestinations().then(setResults);
  }, []);

  const handleSearchChange = async (text: string): Promise<void> => {
    setSearchQuery(text);
    setIsSearching(true);

    try {
      if (!text.trim()) {
        const popular = await MockTransitService.getPopularDestinations();
        setResults(popular);
        setIsSearching(false);
        return;
      }

      // Query real PostGIS places search
      const apiPlaces = await transitApiService.searchPlaces(text);
      if (apiPlaces && apiPlaces.length > 0) {
        setResults(
          apiPlaces.map((p) => ({
            id: p.id,
            name: p.name,
            area: p.address || 'Metro Manila',
            category: p.category as Destination['category'],
            coordinates: {
              latitude: p.latitude,
              longitude: p.longitude,
            },
          }))
        );
      } else {
        const mockFiltered = await MockTransitService.searchDestinations(text);
        setResults(mockFiltered);
      }
    } catch {
      const mockFiltered = await MockTransitService.searchDestinations(text);
      setResults(mockFiltered);
    } finally {
      setIsSearching(false);
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'mall':
        return '🛍️';
      case 'university':
        return '🎓';
      case 'station':
        return '🚆';
      case 'terminal':
        return '🚌';
      case 'business':
        return '🏢';
      case 'landmark':
      default:
        return '📍';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Select Destination" onBack={onBack} />

      <View style={styles.searchSection}>
        {/* Origin Pill (Fixed to Current Location) */}
        <View style={styles.originRow}>
          <Text style={styles.originIcon}>🟢</Text>
          <Text style={styles.originLabel}>From:</Text>
          <Text style={styles.originValue} numberOfLines={1}>
            UP Diliman (Current Location)
          </Text>
        </View>

        {/* Destination Search Input */}
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Where to? (e.g. SM North, Cubao, MRT)"
          autoFocus={true}
          onClear={() => handleSearchChange('')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* If query is empty, show Recent Searches */}
        {!searchQuery.trim() && recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
            {recentSearches.map((item) => (
              <TouchableOpacity
                key={`recent-${item.id}`}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => onSelectDestination(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select recent ${item.name}`}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>⏱</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemArea}>
                    {item.area} · {item.subtitle || item.category}
                  </Text>
                </View>
                <Text style={styles.selectArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Results List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() ? `SEARCH RESULTS (${results.length})` : 'POPULAR DESTINATIONS'}
          </Text>

          {results.length === 0 && !isSearching ? (
            <EmptyState
              title="No locations found"
              description={`No destinations matching "${searchQuery}". Try searching for "SM North", "Cubao", or "UP Diliman".`}
              showMascot={true}
            />
          ) : (
            results.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultItem, shadows.subtle]}
                onPress={() => onSelectDestination(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select destination ${item.name}`}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{getCategoryIcon(item.category)}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemArea}>
                    {item.area} {item.subtitle ? `· ${item.subtitle}` : ''}
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemArea: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  selectArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
