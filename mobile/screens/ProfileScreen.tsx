import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { Mascot } from '../components/common/Mascot';

import { useAuth } from '../context/AuthContext';

const RNTouchableOpacity = TouchableOpacity as any;

interface ProfileScreenProps {
  onOpenSettings: () => void;
  onOpenSaved: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenReportIssue?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenSettings,
  onOpenSaved,
  onOpenLogin,
  onOpenRegister,
  onOpenReportIssue,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your BiyaEase account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const menuItems = [
    {
      id: 'report',
      icon: '📢',
      title: 'Submit Crowd Report',
      subtitle: 'Share real-time transit & traffic alerts',
      action: onOpenReportIssue || (() => {}),
    },
    {
      id: 'saved',
      icon: '⭐',
      title: 'Saved Places & Routes',
      subtitle: 'Manage your bookmarked locations',
      action: onOpenSaved,
    },
    {
      id: 'history',
      icon: '🕒',
      title: 'Trip History',
      subtitle: 'Completed commutes and fare summaries',
      action: () =>
        Alert.alert('Trip History', 'Displays your past commuter itineraries and fare summaries.'),
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Settings & Preferences',
      subtitle: 'Language, dark mode & walking speed',
      action: onOpenSettings,
    },
    {
      id: 'about',
      icon: 'ℹ️',
      title: 'About BiyaEase',
      subtitle: 'Version 0.1.0 (Phase 11 Authentication & Cloud Sync)',
      action: () =>
        Alert.alert(
          'About BiyaEase',
          'BiyaEase is a Philippine public transportation and commute navigation application.\n\nMade with ❤️ for Filipino commuters.'
        ),
    },
  ];

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2026';

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Commuter Profile" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        {isAuthenticated && user ? (
          <View style={[styles.profileCard, shadows.card]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </Text>
            </View>

            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.memberBadge}>
              <Text style={styles.memberText}>🟢 Cloud Sync Active · Joined {formattedDate}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.profileCard, styles.guestCard, shadows.card]}>
            <View style={[styles.avatarCircle, styles.guestAvatar]}>
              <Text style={styles.avatarInitials}>👤</Text>
            </View>

            <Text style={styles.userName}>Guest Commuter</Text>
            <Text style={styles.userEmail}>Local offline storage active</Text>

            <View style={styles.authBtnRow}>
              <RNTouchableOpacity style={styles.signInBtn} onPress={onOpenLogin}>
                <Text style={styles.signInBtnText}>Sign In</Text>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.registerBtn} onPress={onOpenRegister}>
                <Text style={styles.registerBtnText}>Register</Text>
              </RNTouchableOpacity>
            </View>
          </View>
        )}

        {/* Mascot Banner */}
        <View style={styles.mascotBanner}>
          <Mascot size={52} mood="happy" showBadge={true} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>BiyaEase Cloud Sync</Text>
            <Text style={styles.bannerSub}>
              {isAuthenticated
                ? 'Your saved places and favorite routes are safely backed up to the cloud!'
                : 'Sign in to automatically sync your saved places across your mobile devices.'}
            </Text>
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

              <Text style={styles.menuArrow}>➔</Text>
            </TouchableOpacity>
          ))}

          {isAuthenticated && (
            <RNTouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>🚪 Sign Out of Account</Text>
            </RNTouchableOpacity>
          )}
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
  guestCard: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
  },
  guestAvatar: {
    backgroundColor: '#9CA3AF',
    borderColor: '#E5E7EB',
  },
  authBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minHeight: 38,
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
  },
  registerBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 38,
    justifyContent: 'center',
  },
  registerBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#991B1B',
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
