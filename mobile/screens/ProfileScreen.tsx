import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { Mascot } from '../components/common/Mascot';
import { mockUserProfile } from '../data/mockData';

interface ProfileScreenProps {
  onOpenSettings: () => void;
  onOpenSaved: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenSettings, onOpenSaved }) => {
  const menuItems = [
    {
      id: 'saved',
      icon: '⭐',
      title: 'Saved Places & Routes',
      subtitle: '3 places bookmarked',
      action: onOpenSaved,
    },
    {
      id: 'history',
      icon: '🕒',
      title: 'Trip History',
      subtitle: `${mockUserProfile.totalTrips} completed commutes`,
      action: () =>
        Alert.alert('Trip History', 'Displays your past commuter itineraries and fare summaries.'),
    },
    {
      id: 'reports',
      icon: '📢',
      title: 'Community Reports',
      subtitle: 'Crowdsourced transit updates (Phase 12)',
      action: () =>
        Alert.alert(
          'Community Reports',
          'Phase 12 will introduce crowdsourced traffic and transit reports.'
        ),
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Settings & Preferences',
      subtitle: 'Language, dark mode & walking',
      action: onOpenSettings,
    },
    {
      id: 'about',
      icon: 'ℹ️',
      title: 'About BiyaEase',
      subtitle: 'Version 0.1.0 (Phase 1 UI/UX Foundation)',
      action: () =>
        Alert.alert(
          'About BiyaEase',
          'BiyaEase is a Philippine public transportation and commute navigation application.\n\nMade with ❤️ for Filipino commuters.'
        ),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Commuter Profile" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.profileCard, shadows.card]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {mockUserProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </View>

          <Text style={styles.userName}>{mockUserProfile.name}</Text>
          <Text style={styles.userEmail}>{mockUserProfile.email}</Text>

          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>
              🇵🇭 Metro Manila Commuter · Since {mockUserProfile.memberSince}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, shadows.subtle]}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mockUserProfile.totalTrips}</Text>
            <Text style={styles.statLabel}>Trips Taken</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🚐 Jeepney</Text>
            <Text style={styles.statLabel}>Top Transit</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₱1,040</Text>
            <Text style={styles.statLabel}>Est. Savings</Text>
          </View>
        </View>

        {/* Mascot Banner */}
        <View style={styles.mascotBanner}>
          <Mascot size={52} mood="happy" showBadge={true} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>BiyaEase Navigator</Text>
            <Text style={styles.bannerSub}>"Bawat biyahe, may kwento. Ingat palagi sa daan!"</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>ACCOUNT & SETTINGS</Text>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, shadows.subtle]}
              onPress={item.action}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarInitials: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.textInverse,
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  memberBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  memberText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  bannerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  bannerSub: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
});
