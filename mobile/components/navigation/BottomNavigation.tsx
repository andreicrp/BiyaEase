import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, shadows } from '../../constants/spacing';

export type MainTabType = 'home' | 'nearby' | 'saved' | 'profile';

interface BottomNavigationProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  style?: ViewStyle;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  style,
}) => {
  const tabs: { key: MainTabType; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'nearby', label: 'Nearby', icon: '📍' },
    { key: 'saved', label: 'Saved', icon: '⭐' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={[styles.container, shadows.card, style]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Text style={styles.icon}>{tab.icon}</Text>
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 32,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: colors.primaryLight,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: typography.fontSize.xxs,
    letterSpacing: 0.2,
  },
});
