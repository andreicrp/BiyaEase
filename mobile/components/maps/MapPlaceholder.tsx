import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { LocationMarker } from './LocationMarker';

interface MapPlaceholderProps {
  height?: number;
  origin?: string;
  destination?: string;
  showRouteLine?: boolean;
  showNearbyPins?: boolean;
  activeStepIndex?: number;
  interactiveHint?: string;
  style?: ViewStyle;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  height = 220,
  origin = 'UP Diliman',
  destination = 'SM North EDSA',
  showRouteLine = true,
  showNearbyPins = false,
  activeStepIndex = 1,
  interactiveHint,
  style,
}) => {
  return (
    <View style={[styles.container, { height }, style]}>
      {/* Grid Pattern Simulating City Roads & Blocks */}
      <View style={styles.roadNetwork}>
        {/* Horizontal Major Avenues */}
        <View style={[styles.roadHorizontal, { top: '22%', height: 16 }]} />
        <View style={[styles.roadHorizontal, { top: '55%', height: 24 }]} />
        <View style={[styles.roadHorizontal, { top: '80%', height: 12 }]} />

        {/* Diagonal / Curved Highway (e.g. EDSA / Commonwealth) */}
        <View
          style={[
            styles.highwayCurve,
            {
              top: '10%',
              left: '-10%',
              width: '120%',
              height: 28,
              transform: [{ rotate: '-22deg' }],
            },
          ]}
        />

        {/* Vertical Streets */}
        <View style={[styles.roadVertical, { left: '25%', width: 14 }]} />
        <View style={[styles.roadVertical, { left: '62%', width: 20 }]} />
        <View style={[styles.roadVertical, { left: '85%', width: 12 }]} />
      </View>

      {/* Simulated Route Polyline */}
      {showRouteLine && (
        <View style={styles.routeLayer} pointerEvents="none">
          {/* Walking Path Line (Dotted) */}
          <View style={[styles.routeSegment, styles.walkingSegment]} />
          {/* Main Transit Corridor Line */}
          <View style={[styles.routeSegment, styles.transitSegment]} />
        </View>
      )}

      {/* Origin Pin */}
      <View style={[styles.pinWrapper, { top: '25%', left: '15%' }]}>
        <LocationMarker type="origin" label={origin} />
      </View>

      {/* Intermediate Transfer / Stop Node */}
      {showRouteLine && (
        <View style={[styles.pinWrapper, { top: '48%', left: '52%' }]}>
          <LocationMarker
            type={activeStepIndex === 1 ? 'current' : 'transfer'}
            label="Philcoa Transfer"
            sublabel="Jeepney / Bus Bay"
          />
        </View>
      )}

      {/* Destination Pin */}
      <View style={[styles.pinWrapper, { bottom: '15%', right: '12%' }]}>
        <LocationMarker type="destination" label={destination} />
      </View>

      {/* Nearby Mode Markers (if enabled) */}
      {showNearbyPins && (
        <>
          <View style={[styles.pinWrapper, { top: '15%', right: '28%' }]}>
            <View style={styles.nearbyChip}>
              <Text style={styles.nearbyChipText}>🚌 Busway 800m</Text>
            </View>
          </View>
          <View style={[styles.pinWrapper, { bottom: '22%', left: '32%' }]}>
            <View style={styles.nearbyChip}>
              <Text style={styles.nearbyChipText}>🚐 Jeep 150m</Text>
            </View>
          </View>
        </>
      )}

      {/* Map Provider Notice & Badge */}
      <View style={styles.badgeOverlay}>
        <Text style={styles.badgeText}>🗺️ BiyaEase Vector Transit Map</Text>
      </View>

      {interactiveHint && (
        <View style={styles.hintOverlay}>
          <Text style={styles.hintText}>{interactiveHint}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E6F4F1', // Light map tone
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
  },
  roadNetwork: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  roadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1EAE5',
  },
  highwayCurve: {
    position: 'absolute',
    backgroundColor: '#FEF3C7',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FDE68A',
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D1EAE5',
  },
  routeLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeSegment: {
    position: 'absolute',
  },
  walkingSegment: {
    top: '34%',
    left: '26%',
    width: '28%',
    height: 4,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: colors.walking,
    transform: [{ rotate: '32deg' }],
  },
  transitSegment: {
    top: '58%',
    left: '52%',
    width: '38%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-24deg' }],
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pinWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  nearbyChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nearbyChipText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  hintOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hintText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
