import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SavedPlace } from '../../types/index';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';

interface SavedPlaceCardProps {
  place: SavedPlace;
  onPress: (place: SavedPlace) => void;
  onDelete?: (place: SavedPlace) => void;
  style?: ViewStyle;
}

export const SavedPlaceCard: React.FC<SavedPlaceCardProps> = ({
  place,
  onPress,
  onDelete,
  style,
}) => {
  const getIcon = (type: string): string => {
    switch (type) {
      case 'home':
        return '🏠';
      case 'work':
        return '💼';
      case 'school':
        return '🎓';
      default:
        return '⭐';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.subtle, style]}
      onPress={() => onPress(place)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Saved place ${place.name}, ${place.address}`}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{place.customIcon || getIcon(place.type)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {place.address}
        </Text>
      </View>

      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(place)}
          activeOpacity={0.7}
          accessibilityLabel="Delete saved place"
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.arrowIcon}>→</Text>
      )}
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  address: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 16,
    color: colors.textMuted,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  deleteIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
