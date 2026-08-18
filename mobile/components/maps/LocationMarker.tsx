import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface LocationMarkerProps {
  type: 'origin' | 'destination' | 'transfer' | 'current' | 'stop';
  label?: string;
  sublabel?: string;
  style?: ViewStyle;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ type, label, sublabel, style }) => {
  const getMarkerConfig = (): {
    pinColor: string;
    icon: string;
    badgeBg: string;
  } => {
    switch (type) {
      case 'origin':
        return {
          pinColor: colors.primary,
          icon: '🟢',
          badgeBg: colors.primaryLight,
        };
      case 'destination':
        return {
          pinColor: colors.error,
          icon: '📍',
          badgeBg: colors.errorLight,
        };
      case 'transfer':
        return {
          pinColor: colors.secondary,
          icon: '🔄',
          badgeBg: colors.secondaryLight,
        };
      case 'current':
        return {
          pinColor: colors.info,
          icon: '🧭',
          badgeBg: colors.infoLight,
        };
      case 'stop':
      default:
        return {
          pinColor: colors.textSecondary,
          icon: '⚪',
          badgeBg: colors.cardAlt,
        };
    }
  };

  const config = getMarkerConfig();

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.pin,
          {
            backgroundColor: config.badgeBg,
            borderColor: config.pinColor,
          },
        ]}
      >
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      {label && (
        <View style={styles.labelBubble}>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
          {sublabel && (
            <Text style={styles.sublabelText} numberOfLines={1}>
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    fontSize: 14,
  },
  labelBubble: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  labelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sublabelText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
  },
});
