import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { RouteCard } from '../components/routes/RouteCard';
import { LoadingState } from '../components/common/LoadingState';
import { MockTransitService } from '../services/mockTransitService';
import { RouteOption, RouteFilterCategory, Destination } from '../types/index';
import { SelectedLocation } from '../types/search.types';

interface RouteOptionsScreenProps {
  origin?: string;
  destination: Destination | SelectedLocation | string;
  onBack: () => void;
  onSelectRoute: (route: RouteOption) => void;
}

export const RouteOptionsScreen: React.FC<RouteOptionsScreenProps> = ({
  origin = 'UP Diliman',
  destination,
  onBack,
  onSelectRoute,
}) => {
  const destinationName = typeof destination === 'string' ? destination : destination.name;

  const [filter, setFilter] = useState<RouteFilterCategory>('all');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    MockTransitService.getRouteOptions(origin, destinationName, filter).then((data) => {
      setRoutes(data);
      setLoading(false);
    });
  }, [destinationName, filter, origin]);

  const filterChips: { key: RouteFilterCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All Routes', icon: '🗺️' },
    { key: 'fastest', label: 'Fastest', icon: '⚡' },
    { key: 'cheapest', label: 'Cheapest', icon: '💰' },
    { key: 'less_walking', label: 'Less Walking', icon: '🚶' },
    { key: 'fewer_transfers', label: 'Fewer Transfers', icon: '🔄' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Route Options" onBack={onBack} />

      {/* Origin -> Destination Trip Header Bar */}
      <View style={styles.tripSummaryHeader}>
        <View style={styles.endpointRow}>
          <Text style={styles.endpointDot}>🟢</Text>
          <Text style={styles.endpointText} numberOfLines={1}>
            {origin}
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
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${chip.label}`}
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

      {/* Routes List */}
      {loading ? (
        <LoadingState message="Comparing Philippine commute options..." showMascot={true} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>Found {routes.length} practical commute routes</Text>

          {routes.map((route) => (
            <RouteCard key={route.id} route={route} onPress={onSelectRoute} />
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
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
