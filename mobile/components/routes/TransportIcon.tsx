import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TransitMode } from '../../types/index';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface TransportIconProps {
  mode: TransitMode;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: ViewStyle;
}

export const TransportIcon: React.FC<TransportIconProps> = ({
  mode,
  size = 'md',
  showLabel = false,
  style,
}) => {
  const getModeDetails = (
    m: TransitMode
  ): { icon: string; label: string; bgColor: string; lightBg: string } => {
    switch (m) {
      case 'jeepney':
        return {
          icon: '🚐',
          label: 'Jeepney',
          bgColor: colors.jeepney,
          lightBg: colors.jeepneyLight,
        };
      case 'bus':
        return {
          icon: '🚌',
          label: 'Bus',
          bgColor: colors.bus,
          lightBg: colors.busLight,
        };
      case 'mrt':
        return {
          icon: '🚆',
          label: 'MRT',
          bgColor: colors.mrt,
          lightBg: colors.mrtLight,
        };
      case 'lrt':
        return {
          icon: '🚈',
          label: 'LRT',
          bgColor: colors.lrt,
          lightBg: colors.lrtLight,
        };
      case 'uvexpress':
        return {
          icon: '🚐',
          label: 'UV Express',
          bgColor: colors.uvexpress,
          lightBg: colors.uvexpressLight,
        };
      case 'tricycle':
        return {
          icon: '🛺',
          label: 'Tricycle',
          bgColor: colors.tricycle,
          lightBg: colors.tricycleLight,
        };
      case 'walking':
      default:
        return {
          icon: '🚶',
          label: 'Walk',
          bgColor: colors.walking,
          lightBg: colors.walkingLight,
        };
    }
  };

  const details = getModeDetails(mode);

  const dim = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? typography.fontSize.xxs : typography.fontSize.xs;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconBadge,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: details.lightBg,
            borderColor: details.bgColor,
          },
        ]}
      >
        <Text style={{ fontSize: iconSize }}>{details.icon}</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize, color: details.bgColor }]}>{details.label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    marginLeft: 6,
    fontWeight: '700',
  },
});
