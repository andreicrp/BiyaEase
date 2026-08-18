import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { formatDistanceMeters } from '../../utils/geoUtils';
import { ApiTransitStop } from '../../services/transitApiService';

interface StopInfoCardProps {
  stop: ApiTransitStop;
  onClose: () => void;
  onSelectAction?: (stop: ApiTransitStop) => void;
}

export const StopInfoCard: React.FC<StopInfoCardProps> = ({ stop, onClose, onSelectAction }) => {
  const getModeName = (): string => {
    if (stop.mode) return stop.mode.toUpperCase();
    return 'TRANSIT STOP';
  };

  const getModeColor = (): string => {
    if (stop.mode_color) return stop.mode_color;
    const m = (stop.mode || '').toLowerCase();
    if (m.includes('jeep')) return colors.jeepney;
    if (m.includes('mrt')) return colors.mrt;
    if (m.includes('lrt')) return colors.lrt;
    if (m.includes('uv')) return colors.uvexpress;
    if (m.includes('trik')) return colors.tricycle;
    return colors.bus;
  };

  return (
    <View style={[styles.card, shadows.floating]}>
      <View style={styles.topRow}>
        <View style={[styles.modeBadge, { backgroundColor: getModeColor() }]}>
          <Text style={styles.modeBadgeText}>{getModeName()}</Text>
        </View>

        {stop.distance_meters !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              📍 {formatDistanceMeters(stop.distance_meters)} away
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close stop details"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stopName} numberOfLines={2}>
        {stop.name}
      </Text>

      {stop.description ? (
        <Text style={styles.stopDesc} numberOfLines={2}>
          {stop.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.coordsText}>
          {stop.latitude.toFixed(4)}° N, {stop.longitude.toFixed(4)}° E
        </Text>
        {stop.code ? <Text style={styles.codeText}>Code: {stop.code}</Text> : null}
      </View>

      {onSelectAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getModeColor() }]}
          onPress={() => onSelectAction(stop)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>View Connecting Routes →</Text>
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
  modeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  modeBadgeText: {
    color: '#FFFFFF',
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
  stopName: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  stopDesc: {
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
  codeText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: spacing.sm,
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
