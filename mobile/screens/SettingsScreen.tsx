import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [transitLines, setTransitLines] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [alightAlerts, setAlightAlerts] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'FIL'>('EN');
  const [walkingPace, setWalkingPace] = useState<'Standard' | 'Fast' | 'Minimal'>('Standard');

  const toggleLanguage = (): void => {
    setLanguage((prev) => (prev === 'EN' ? 'FIL' : 'EN'));
    Alert.alert(
      'Language Updated',
      `Active language set to ${language === 'EN' ? 'Filipino (Tagalog)' : 'English'}.`
    );
  };

  const cycleWalkingPace = (): void => {
    const paces: ('Standard' | 'Fast' | 'Minimal')[] = ['Standard', 'Fast', 'Minimal'];
    const nextIdx = (paces.indexOf(walkingPace) + 1) % paces.length;
    setWalkingPace(paces[nextIdx]!);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Settings & Preferences" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PREFERENCES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAVIGATION PREFERENCES</Text>

          {/* Language Setting */}
          <TouchableOpacity
            style={[styles.settingRow, shadows.subtle]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingSub}>
                {language === 'EN' ? 'English (US)' : 'Filipino (Tagalog)'}
              </Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{language}</Text>
            </View>
          </TouchableOpacity>

          {/* Walking Pace Preference */}
          <TouchableOpacity
            style={[styles.settingRow, shadows.subtle]}
            onPress={cycleWalkingPace}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Walking Preference</Text>
              <Text style={styles.settingSub}>Adjust speed calculations for transfers</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{walkingPace}</Text>
            </View>
          </TouchableOpacity>

          {/* Map Transit Lines Toggle */}
          <View style={[styles.settingRow, shadows.subtle]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Highlight Transit Corridors</Text>
              <Text style={styles.settingSub}>Show Jeepney routes and MRT/LRT paths</Text>
            </View>
            <Switch
              value={transitLines}
              onValueChange={setTransitLines}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Dark Mode Toggle */}
          <View style={[styles.settingRow, shadows.subtle]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Appearance</Text>
              <Text style={styles.settingSub}>Comfortable navigation at night</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* NOTIFICATIONS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS & ALERTS</Text>

          <View style={[styles.settingRow, shadows.subtle]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingSub}>Receive transit updates and delays</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={[styles.settingRow, shadows.subtle]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Alight & Transfer Reminders</Text>
              <Text style={styles.settingSub}>Alert 2 stops before destination</Text>
            </View>
            <Switch
              value={alightAlerts}
              onValueChange={setAlightAlerts}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* APPLICATION SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICATION INFORMATION</Text>

          <TouchableOpacity
            style={[styles.settingRow, shadows.subtle]}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'BiyaEase stores only essential commute cache on your device. No user tracking without explicit permission.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingSub}>How we handle transit and location data</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, shadows.subtle]}
            onPress={() =>
              Alert.alert(
                'Open Source Licenses',
                'BiyaEase uses React Native, Expo, and OpenStreetMap data.'
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Open Source Libraries</Text>
              <Text style={styles.settingSub}>Third-party packages and transit datasets</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          <View style={[styles.settingRow, shadows.subtle]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingSub}>Phase 1 UI/UX Foundation</Text>
            </View>
            <Text style={styles.versionTag}>v0.1.0-alpha</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  pillBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  arrowIcon: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
  versionTag: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
