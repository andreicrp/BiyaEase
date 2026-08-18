import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { TransitMode } from '../../types/index';

interface StopMarkerProps {
  name: string;
  mode?: TransitMode | string;
  modeColor?: string;
  sequence?: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const StopMarker: React.FC<StopMarkerProps> = ({
  name,
  mode = 'bus',
  modeColor,
  sequence,
  isSelected = false,
  onPress,
}) => {
  const getModeColor = (): string => {
    if (modeColor) return modeColor;
    const m = typeof mode === 'string' ? mode.toLowerCase() : '';
    if (m.includes('jeep')) return colors.jeepney;
    if (m.includes('mrt')) return colors.mrt;
    if (m.includes('lrt')) return colors.lrt;
    if (m.includes('uv')) return colors.uvexpress;
    if (m.includes('trik') || m.includes('tri')) return colors.tricycle;
    if (m.includes('walk')) return colors.walking;
    return colors.bus;
  };

  const getModeIcon = (): string => {
    const m = typeof mode === 'string' ? mode.toLowerCase() : '';
    if (m.includes('jeep')) return '🚐';
    if (m.includes('mrt')) return '🚆';
    if (m.includes('lrt')) return '🚈';
    if (m.includes('uv')) return '🚐';
    if (m.includes('trik') || m.includes('tri')) return '🛺';
    if (m.includes('walk')) return '🚶';
    return '🚌';
  };

  const pinColor = getModeColor();

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Transit stop: ${name}`}
    >
      {/* Sequence Badge if present */}
      {sequence !== undefined && (
        <View style={[styles.sequenceBadge, { backgroundColor: pinColor }]}>
          <Text style={styles.sequenceText}>{sequence}</Text>
        </View>
      )}

      {/* Main Pin Icon */}
      <View
        style={[
          styles.pinHead,
          { backgroundColor: pinColor },
          isSelected && styles.selectedPinHead,
        ]}
      >
        <Text style={styles.pinIcon}>{getModeIcon()}</Text>
      </View>

      {/* Pin Point Needle */}
      <View style={[styles.pinNeedle, { borderTopColor: pinColor }]} />

      {/* Stop Label Banner */}
      {isSelected && (
        <View style={styles.labelContainer}>
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
    minWidth: 40,
    minHeight: 40,
  },
  selectedContainer: {
    zIndex: 999,
  },
  pinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedPinHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: colors.secondary,
    transform: [{ scale: 1.1 }],
  },
  pinIcon: {
    fontSize: 14,
  },
  pinNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  sequenceBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sequenceText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  labelContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
