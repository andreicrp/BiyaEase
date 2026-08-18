import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface UserLocationMarkerProps {
  size?: number;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ size = 20 }) => {
  return (
    <View style={[styles.container, { width: size + 16, height: size + 16 }]}>
      {/* Outer Pulse Halo */}
      <View
        style={[
          styles.halo,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
          },
        ]}
      />

      {/* Solid Inner Dot */}
      <View
        style={[
          styles.innerDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View style={styles.centerWhiteDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  innerDot: {
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  centerWhiteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
