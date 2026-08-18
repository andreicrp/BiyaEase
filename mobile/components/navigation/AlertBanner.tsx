import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { NavigationAlert } from '../../navigation/navigationTypes';

interface AlertBannerProps {
  alert: NavigationAlert;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert }) => {
  const getBannerConfig = () => {
    switch (alert.type) {
      case 'alighting':
        return {
          bg: '#FEF2F2',
          border: '#F87171',
          icon: '🔔',
          titleColor: '#991B1B',
          subColor: '#B91C1C',
        };
      case 'boarding':
        return {
          bg: '#EFF6FF',
          border: '#60A5FA',
          icon: '🚏',
          titleColor: '#1E40AF',
          subColor: '#2563EB',
        };
      case 'transfer':
        return {
          bg: '#FFFBEB',
          border: '#FBBF24',
          icon: '🔄',
          titleColor: '#92400E',
          subColor: '#B45309',
        };
      case 'arrival':
        return {
          bg: '#ECFDF5',
          border: '#34D399',
          icon: '🎉',
          titleColor: '#065F46',
          subColor: '#047857',
        };
      case 'off_route':
      default:
        return {
          bg: '#FFF1F2',
          border: '#FB7185',
          icon: '⚠️',
          titleColor: '#9F1239',
          subColor: '#BE123C',
        };
    }
  };

  const config = getBannerConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }, shadows.floating]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.titleColor }]}>{alert.title}</Text>
        <Text style={[styles.subtitle, { color: config.subColor }]}>{alert.subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '600',
    marginTop: 1,
  },
});
