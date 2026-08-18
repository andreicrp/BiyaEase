import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { SavedPlaceCard } from '../components/routes/SavedPlaceCard';
import { EmptyState } from '../components/common/EmptyState';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { FareBadge } from '../components/common/FareBadge';
import { TimeBadge } from '../components/common/TimeBadge';
import { mockSavedPlaces, mockSavedRoutes } from '../data/mockData';
import { SavedPlace, SavedRoute } from '../types/index';

interface SavedScreenProps {
  onSelectPlace?: (place: SavedPlace) => void;
  onSelectRoute?: (route: SavedRoute) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onSelectPlace, onSelectRoute }) => {
  const [activeTab, setActiveTab] = useState<'places' | 'routes'>('places');
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(mockSavedPlaces);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(mockSavedRoutes);

  const handleAddPlace = (): void => {
    const newPlace: SavedPlace = {
      id: `custom-${Date.now()}`,
      name: 'Katipunan Hub',
      address: 'Katipunan Ave cor. Aurora Blvd, QC',
      type: 'other',
      customIcon: '⭐',
    };
    setSavedPlaces((prev) => [newPlace, ...prev]);
    Alert.alert('✅ Saved Place Added', 'Katipunan Hub has been bookmarked to your saved places.');
  };

  const handleDeletePlace = (place: SavedPlace): void => {
    setSavedPlaces((prev) => prev.filter((p) => p.id !== place.id));
  };

  const handleDeleteRoute = (route: SavedRoute): void => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== route.id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Saved Bookmarks" subtitle="Quick Access Places & Routes" />

      {/* Segmented Control Tabs */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'places' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('places')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeTab === 'places' && styles.activeSegmentText]}>
            Saved Places ({savedPlaces.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'routes' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('routes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeTab === 'routes' && styles.activeSegmentText]}>
            Saved Routes ({savedRoutes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'places' ? (
          <>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.sectionTitle}>MY SAVED LOCATIONS</Text>
              <PrimaryButton title="+ Add Saved Place" onPress={handleAddPlace} size="sm" />
            </View>

            {savedPlaces.length === 0 ? (
              <EmptyState
                title="No saved places yet"
                description="Save your Home, Work, or favorite hangouts for instant commute calculations."
                actionLabel="+ Add New Place"
                onAction={handleAddPlace}
              />
            ) : (
              savedPlaces.map((place) => (
                <SavedPlaceCard
                  key={place.id}
                  place={place}
                  onPress={(p) => onSelectPlace?.(p)}
                  onDelete={handleDeletePlace}
                />
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.sectionTitle}>FREQUENT COMMUTE ROUTES</Text>
            </View>

            {savedRoutes.length === 0 ? (
              <EmptyState
                title="No saved routes"
                description="Bookmark your daily commute itineraries for one-tap navigation."
              />
            ) : (
              savedRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={[styles.routeItem, shadows.subtle]}
                  onPress={() => onSelectRoute?.(route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routePath}>
                      {route.origin} → {route.destination}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteRoute(route)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.routeMetricsRow}>
                    <TimeBadge durationMinutes={route.durationMinutes} size="sm" />
                    <View style={{ marginLeft: 8 }}>
                      <FareBadge fare={route.fare} size="sm" />
                    </View>
                    <Text style={styles.transfersTag}>
                      {route.transfersCount === 0
                        ? 'Direct ride'
                        : `${route.transfersCount} transfer`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xs,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  activeSegmentBtn: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeSegmentText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  routeItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  routePath: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  transfersTag: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    fontWeight: '500',
  },
});
