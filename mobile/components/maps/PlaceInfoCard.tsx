import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { formatDistanceMeters } from '../../utils/geoUtils';
import { ApiPlace } from '../../services/transitApiService';

interface PlaceInfoCardProps {
  place: ApiPlace;
  onClose: () => void;
  onSelectDestination?: (place: ApiPlace) => void;
}

export const PlaceInfoCard: React.FC<PlaceInfoCardProps> = ({
  place,
  onClose,
  onSelectDestination,
}) => {
  return (
    <View style={[styles.card, shadows.floating]}>
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{place.category.toUpperCase()}</Text>
        </View>

        {place.distance_meters !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              📍 {formatDistanceMeters(place.distance_meters)} away
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close place details"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.placeName} numberOfLines={2}>
        {place.name}
      </Text>

      {place.address ? (
        <Text style={styles.placeAddress} numberOfLines={2}>
          {place.address}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.coordsText}>
          {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
        </Text>
        {place.nearby_transit_count !== undefined ? (
          <Text style={styles.transitCountText}>
            🚍 {place.nearby_transit_count} transit stops nearby
          </Text>
        ) : null}
      </View>

      {onSelectDestination && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSelectDestination(place)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Set as Destination 🎯</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  categoryText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distanceBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  distanceText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  placeName: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  placeAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coordsText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  transitCountText: {
    fontSize: typography.fontSize.xxs,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.fontSize.xs,
  },
});
