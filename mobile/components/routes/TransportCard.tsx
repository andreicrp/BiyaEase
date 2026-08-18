import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { NearbyTransport } from '../../types/index';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { TransportIcon } from './TransportIcon';

interface TransportCardProps {
  item: NearbyTransport;
  onPress?: (item: NearbyTransport) => void;
  style?: ViewStyle;
}

export const TransportCard: React.FC<TransportCardProps> = ({ item, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.card, shadows.subtle, style]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.routeName}, ${item.distanceMeters} meters away`}
    >
      <View style={styles.iconWrapper}>
        <TransportIcon mode={item.mode} size="md" />
      </View>

      <View style={styles.infoWrapper}>
        <Text style={styles.routeName} numberOfLines={1}>
          {item.routeName}
        </Text>
        <Text style={styles.headingText} numberOfLines={1}>
          {item.heading}
        </Text>
        <Text style={styles.stopText} numberOfLines={1}>
          📍 {item.stopName}
        </Text>
      </View>

      <View style={styles.rightWrapper}>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {item.distanceMeters >= 1000
              ? `${(item.distanceMeters / 1000).toFixed(1)} km`
              : `${item.distanceMeters} m`}
          </Text>
        </View>
        <Text style={styles.etaText}>~{item.etaMinutes} min away</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    marginRight: spacing.md,
  },
  infoWrapper: {
    flex: 1,
  },
  routeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stopText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightWrapper: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  distanceBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  etaText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
});
