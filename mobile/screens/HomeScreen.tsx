import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { SearchBar } from '../components/common/SearchBar';
import { SectionHeader } from '../components/common/SectionHeader';
import { MapPlaceholder } from '../components/maps/MapPlaceholder';
import { TransportCard } from '../components/routes/TransportCard';
import { FareBadge } from '../components/common/FareBadge';
import { TimeBadge } from '../components/common/TimeBadge';
import {
  mockNearbyTransport,
  mockRecentTrips,
  mockSavedPlaces,
  mockUserProfile,
} from '../data/mockData';
import { Destination, SavedPlace, RecentTrip } from '../types/index';

interface HomeScreenProps {
  onOpenSearch: () => void;
  onSelectDestination: (dest: Destination) => void;
  onSelectSavedPlace: (place: SavedPlace) => void;
  onSelectRecentTrip: (trip: RecentTrip) => void;
  onOpenNearby: () => void;
  onOpenProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenSearch,
  onSelectSavedPlace,
  onSelectRecentTrip,
  onOpenNearby,
  onOpenProfile,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.topHeader}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingSub}>Magandang Araw! 👋</Text>
          <Text style={styles.greetingTitle}>Where are you going?</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onOpenProfile}
            activeOpacity={0.8}
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>
              {mockUserProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Search Action Card */}
        <View style={styles.searchCardWrapper}>
          <SearchBar
            value=""
            placeholder="Search destination (e.g. SM North, UP Diliman)"
            editable={false}
            onPress={onOpenSearch}
          />

          {/* Current Location Pill */}
          <View style={styles.currentLocationRow}>
            <Text style={styles.locationPinIcon}>📍</Text>
            <Text style={styles.currentLocationLabel}>Current origin:</Text>
            <Text style={styles.currentLocationName} numberOfLines={1}>
              UP Diliman, Quezon City
            </Text>
          </View>
        </View>

        {/* Quick Destinations (Home, School, Work) */}
        <View style={styles.section}>
          <Text style={styles.quickLabel}>QUICK DESTINATIONS</Text>
          <View style={styles.quickDestGrid}>
            {mockSavedPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={[styles.quickDestCard, shadows.subtle]}
                onPress={() => onSelectSavedPlace(place)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${place.name}`}
              >
                <Text style={styles.quickIcon}>
                  {place.type === 'home' ? '🏠' : place.type === 'school' ? '🎓' : '💼'}
                </Text>
                <Text style={styles.quickName}>{place.name}</Text>
                <Text style={styles.quickAddress} numberOfLines={1}>
                  {place.address}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Transportation & Map Preview */}
        <View style={styles.section}>
          <SectionHeader
            title="Nearby Transport"
            actionLabel="View Map →"
            onAction={onOpenNearby}
            badge="LIVE MOCK"
          />

          <MapPlaceholder
            height={160}
            origin="UP Diliman"
            destination="SM North EDSA"
            showRouteLine={false}
            showNearbyPins={true}
            style={styles.miniMap}
          />

          <View style={styles.nearbyList}>
            {mockNearbyTransport.slice(0, 3).map((item) => (
              <TransportCard key={item.id} item={item} onPress={onOpenNearby} />
            ))}
          </View>
        </View>

        {/* Recent Trips Section */}
        <View style={styles.section}>
          <SectionHeader title="Recent Trips" />

          {mockRecentTrips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={[styles.recentTripCard, shadows.subtle]}
              onPress={() => onSelectRecentTrip(trip)}
              activeOpacity={0.8}
            >
              <View style={styles.recentTripInfo}>
                <Text style={styles.recentTripRoute}>
                  {trip.origin} → {trip.destination}
                </Text>
                <Text style={styles.recentTripTimestamp}>{trip.timestamp}</Text>
              </View>

              <View style={styles.recentTripMetrics}>
                <TimeBadge durationMinutes={trip.durationMinutes} size="sm" />
                <View style={{ marginLeft: 6 }}>
                  <FareBadge fare={trip.fare} size="sm" />
                </View>
              </View>
            </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingSub: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  searchCardWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  locationPinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  currentLocationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 4,
  },
  currentLocationName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  quickLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  quickDestGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickDestCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  quickIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickAddress: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniMap: {
    marginBottom: spacing.md,
  },
  nearbyList: {
    marginTop: spacing.xs,
  },
  recentTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentTripInfo: {
    flex: 1,
  },
  recentTripRoute: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recentTripTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentTripMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
