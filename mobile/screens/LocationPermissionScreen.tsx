import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { Mascot } from '../components/common/Mascot';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';

interface LocationPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({
  onAllow,
  onSkip,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Permission Graphic Card */}
        <View style={[styles.visualCard, shadows.card]}>
          <View style={styles.pinCircle}>
            <Text style={styles.pinIcon}>📍</Text>
          </View>
          <Mascot size={88} mood="navigating" showBadge={true} style={styles.mascot} />
        </View>

        {/* Heading & Explanation */}
        <Text style={styles.title}>Let BiyaEase know where you are</Text>
        <Text style={styles.description}>
          Your location helps us find nearby jeepney stops, bus terminals, and MRT/LRT stations to
          calculate the most practical commute for you.
        </Text>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Used only for route calculation. Your location data is private.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <PrimaryButton title="Allow Location Access" onPress={onAllow} style={styles.allowButton} />
        <SecondaryButton
          title="Maybe Later"
          onPress={onSkip}
          variant="ghost"
          style={styles.skipButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  visualCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#99F6E4',
  },
  pinCircle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pinIcon: {
    fontSize: 18,
  },
  mascot: {
    marginTop: 6,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  allowButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  skipButton: {
    width: '100%',
  },
});
