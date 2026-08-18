import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StartEndMarkerProps {
  type: 'start' | 'end' | 'transit_mode';
  label?: string;
  icon?: string;
  modeColor?: string;
}

const RNView = View as any;

export const StartEndMarker: React.FC<StartEndMarkerProps> = ({
  type,
  label,
  icon,
  modeColor = '#2563EB',
}) => {
  if (type === 'start') {
    return (
      <RNView style={styles.startWrapper}>
        <RNView style={styles.startPill}>
          <Text style={styles.pillText}>{label || 'Start'}</Text>
        </RNView>
        <RNView style={styles.pinTipStart} />
      </RNView>
    );
  }

  if (type === 'end') {
    return (
      <RNView style={styles.endWrapper}>
        <RNView style={styles.endPill}>
          <Text style={styles.pillText}>End 🚶</Text>
        </RNView>
        <RNView style={styles.pinTipEnd} />
      </RNView>
    );
  }

  // Transit Mode Circle Badge along polyline (e.g. 🚌 Bus, 🛺 Jeep, 🚆 Train)
  return (
    <RNView style={styles.badgeWrapper}>
      <RNView style={[styles.modeBadge, { backgroundColor: modeColor }]}>
        <Text style={styles.modeIcon}>{icon || '🚌'}</Text>
      </RNView>
    </RNView>
  );
};

const styles = StyleSheet.create({
  startWrapper: {
    alignItems: 'center',
  },
  startPill: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  endWrapper: {
    alignItems: 'center',
  },
  endPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pinTipStart: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3B82F6',
  },
  pinTipEnd: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DC2626',
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 3,
  },
  modeIcon: {
    fontSize: 13,
  },
});
