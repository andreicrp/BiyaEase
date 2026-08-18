import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { Mascot } from '../components/common/Mascot';
import { PrimaryButton } from '../components/common/PrimaryButton';

interface SplashScreenProps {
  onFinish: () => void;
  autoAdvance?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, autoAdvance = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();

    if (autoAdvance) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoAdvance, fadeAnim, onFinish, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Brand Mascot */}
        <Mascot size={110} mood="happy" showBadge={true} style={styles.mascot} />

        {/* Brand Wordmark */}
        <Text style={styles.brandTitle}>BiyaEase</Text>
        <Text style={styles.tagline}>Philippine Commute Navigation</Text>

        {/* Subtitle Value Proposition */}
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>🇵🇭 Jeepney · UV · Bus · MRT · LRT</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Get Started →"
          onPress={onFinish}
          variant="primary"
          style={styles.continueButton}
        />
        <Text style={styles.versionText}>v0.1.0 · Phase 1 UI/UX Foundation</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    marginBottom: spacing.xl,
  },
  brandTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  pillBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  pillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  continueButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  versionText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
