import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { MapPlaceholder } from '../components/maps/MapPlaceholder';
import { TransportCard } from '../components/routes/TransportCard';
import { mockNearbyTransport } from '../data/mockData';
import { NearbyTransport, TransitMode } from '../types/index';

interface NearbyScreenProps {
  onSelectTransport?: (item: NearbyTransport) => void;
}

export const NearbyScreen: React.FC<NearbyScreenProps> = ({ onSelectTransport }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | TransitMode>('all');

  const filterTabs: { key: 'all' | TransitMode; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📍' },
    { key: 'jeepney', label: 'Jeepney', icon: '🚐' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'mrt', label: 'MRT', icon: '🚆' },
    { key: 'lrt', label: 'LRT', icon: '🚈' },
    { key: 'uvexpress', label: 'UV', icon: '🚐' },
  ];

  const filteredList =
    selectedFilter === 'all'
      ? mockNearbyTransport
      : mockNearbyTransport.filter((item) => item.mode === selectedFilter);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Nearby Public Transit" subtitle="Live Stations & Terminals" />

      {/* Large Map Visualizer with Simulated Transit Pins */}
      <MapPlaceholder
        height={220}
        origin="UP Diliman"
        destination="Quezon Ave MRT"
        showRouteLine={false}
        showNearbyPins={true}
        interactiveHint="Live Nearby PUV & Rail Pins"
        style={styles.map}
      />

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

      {/* Nearby Stays / Stations List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>NEARBY TRANSIT NODES ({filteredList.length})</Text>

        {filteredList.map((item) => (
          <TransportCard key={item.id} item={item} onPress={onSelectTransport} />
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
  map: {
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
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
});
