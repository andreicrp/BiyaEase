import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

interface PlaceMarkerProps {
  name: string;
  category?: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  name,
  category = 'landmark',
  isSelected = false,
  onPress,
}) => {
  const getCategoryIcon = (): string => {
    const cat = category.toLowerCase();
    if (cat.includes('mall') || cat.includes('shop')) return '🛍️';
    if (cat.includes('uni') || cat.includes('school') || cat.includes('college')) return '🎓';
    if (cat.includes('transit') || cat.includes('hub') || cat.includes('station')) return '🚉';
    if (cat.includes('gov') || cat.includes('city')) return '🏛️';
    if (cat.includes('work') || cat.includes('office')) return '💼';
    if (cat.includes('home')) return '🏠';
    return '📍';
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Landmark place: ${name}`}
    >
      <View style={[styles.pinBadge, isSelected && styles.selectedPinBadge]}>
        <Text style={styles.icon}>{getCategoryIcon()}</Text>
      </View>
      <View style={styles.needle} />

      {isSelected && (
        <View style={styles.labelWrapper}>
          <Text style={styles.labelText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  selectedContainer: {
    zIndex: 999,
  },
  pinBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedPinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.secondary,
    backgroundColor: colors.primaryDark,
  },
  icon: {
    fontSize: 13,
  },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
    marginTop: -1,
  },
  labelWrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
    maxWidth: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
