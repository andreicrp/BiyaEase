import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

interface MascotProps {
  size?: number;
  mood?: 'happy' | 'waving' | 'navigating' | 'thinking';
  showBadge?: boolean;
  style?: ViewStyle;
}

/**
 * BiyaEase Mascot: "Biya"
 * A modern, friendly, geometric transit navigator companion with teal visor and golden compass badge.
 */
export const Mascot: React.FC<MascotProps> = ({
  size = 80,
  mood = 'happy',
  showBadge = true,
  style,
}) => {
  const scale = size / 80;

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Outer Glow / Halo */}
      <View
        style={[
          styles.halo,
          {
            width: 76 * scale,
            height: 76 * scale,
            borderRadius: 38 * scale,
          },
        ]}
      />

      {/* Main Body (Rounded Teardrop Shape) */}
      <View
        style={[
          styles.body,
          {
            width: 64 * scale,
            height: 64 * scale,
            borderRadius: 32 * scale,
          },
        ]}
      >
        {/* Visor / Navigation Glasses (Teal Dark with Gloss) */}
        <View
          style={[
            styles.visor,
            {
              width: 44 * scale,
              height: 22 * scale,
              borderRadius: 11 * scale,
              top: 14 * scale,
            },
          ]}
        >
          {/* Eyes / Visor Glow Nodes */}
          <View style={styles.visorContent}>
            <View
              style={[
                styles.eyeNode,
                {
                  width: 7 * scale,
                  height: 7 * scale,
                  borderRadius: 3.5 * scale,
                },
              ]}
            />
            {mood === 'navigating' ? (
              <View
                style={[
                  styles.navArrow,
                  {
                    borderBottomWidth: 6 * scale,
                    borderLeftWidth: 4 * scale,
                    borderRightWidth: 4 * scale,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.eyeNode,
                  {
                    width: 7 * scale,
                    height: 7 * scale,
                    borderRadius: 3.5 * scale,
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Friendly Smile */}
        <View
          style={[
            styles.smile,
            {
              width: 14 * scale,
              height: 7 * scale,
              borderBottomLeftRadius: 7 * scale,
              borderBottomRightRadius: 7 * scale,
              top: 20 * scale,
            },
          ]}
        />
      </View>

      {/* Navigator Compass Cap / Badge */}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: 22 * scale,
              height: 22 * scale,
              borderRadius: 11 * scale,
              bottom: 2 * scale,
              right: 2 * scale,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: 11 * scale }]}>🧭</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
  },
  body: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  visor: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  visorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '65%',
  },
  eyeNode: {
    backgroundColor: colors.secondary,
  },
  navArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.secondary,
    transform: [{ rotate: '45deg' }],
  },
  smile: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    elevation: 3,
  },
  badgeText: {
    textAlign: 'center',
  },
});
