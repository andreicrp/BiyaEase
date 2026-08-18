import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/spacing';

interface MapControlsProps {
  onRecenter?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showZoomControls?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onRecenter,
  onZoomIn,
  onZoomOut,
  showZoomControls = true,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Zoom In & Out Pill */}
      {showZoomControls && (
        <View style={[styles.zoomGroup, shadows.subtle]}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onZoomIn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Zoom in on map"
          >
            <Text style={styles.buttonText}>＋</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.controlButton}
            onPress={onZoomOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Zoom out on map"
          >
            <Text style={styles.buttonText}>－</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recenter Button */}
      {onRecenter && (
        <TouchableOpacity
          style={[styles.recenterButton, shadows.subtle]}
          onPress={onRecenter}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Recenter map on current location"
        >
          <Text style={styles.recenterIcon}>🎯</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    alignItems: 'center',
    gap: 10,
    zIndex: 50,
  },
  zoomGroup: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  recenterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterIcon: {
    fontSize: 18,
  },
});
