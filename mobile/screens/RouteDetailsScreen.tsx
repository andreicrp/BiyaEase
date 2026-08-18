import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { MapPlaceholder } from '../components/maps/MapPlaceholder';
import { RouteTimeline } from '../components/routes/RouteTimeline';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { FareBadge } from '../components/common/FareBadge';
import { TimeBadge } from '../components/common/TimeBadge';
import { RouteOption } from '../types/index';

interface RouteDetailsScreenProps {
  route: RouteOption;
  onBack: () => void;
  onStartTrip: (route: RouteOption) => void;
}

export const RouteDetailsScreen: React.FC<RouteDetailsScreenProps> = ({
  route,
  onBack,
  onStartTrip,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Route Details" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Visualization Preview */}
        <MapPlaceholder
          height={200}
          origin={route.origin}
          destination={route.destination}
          showRouteLine={true}
          interactiveHint="Simulated Transit Corridor Preview"
          style={styles.map}
        />

        {/* Route Summary Metrics Card */}
        <View style={[styles.summaryCard, shadows.card]}>
          <View style={styles.badgeRow}>
            <View style={styles.labelBadge}>
              <Text style={styles.labelBadgeText}>{route.label}</Text>
            </View>
            <Text style={styles.summaryTitle}>{route.summary}</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>EST. DURATION</Text>
              <TimeBadge durationMinutes={route.totalDurationMinutes} size="lg" />
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TOTAL FARE</Text>
              <FareBadge fare={route.totalFare} size="lg" variant="solid" />
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TRANSFERS</Text>
              <Text style={styles.metricValue}>
                {route.transfersCount === 0 ? 'Direct' : `${route.transfersCount} transfer`}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricCaption}>TOTAL WALK</Text>
              <Text style={styles.metricValue}>🚶 {route.walkingDistanceMeters}m</Text>
            </View>
          </View>
        </View>

        {/* Commute Step-by-Step Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineSectionTitle}>STEP-BY-STEP DIRECTIONS</Text>
          <RouteTimeline route={route} />
        </View>
      </ScrollView>

      {/* Fixed Sticky Footer with Start Trip Trigger */}
      <View style={[styles.footer, shadows.floating]}>
        <PrimaryButton
          title="START TRIP 🚀"
          onPress={() => onStartTrip(route)}
          size="lg"
          style={styles.startTripButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  map: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  labelBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    marginRight: spacing.sm,
  },
  labelBadgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  summaryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineSection: {
    marginTop: spacing.sm,
  },
  timelineSectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startTripButton: {
    width: '100%',
  },
});
