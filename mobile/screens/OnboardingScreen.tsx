import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { Mascot } from '../components/common/Mascot';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Find your way around the Philippines.',
      description:
        'Discover practical commute routes across jeepneys, UV Express, buses, MRT, and LRT.',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <Mascot size={100} mood="happy" />
          <View style={styles.transitChipsRow}>
            <View style={[styles.chip, { backgroundColor: colors.jeepneyLight }]}>
              <Text style={styles.chipText}>🚐 Jeepney</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.busLight }]}>
              <Text style={styles.chipText}>🚌 Bus</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.mrtLight }]}>
              <Text style={styles.chipText}>🚆 MRT/LRT</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Compare your commute.',
      description:
        'See travel time, estimated fare, walking distance, and transfers before you leave.',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={[styles.comparisonCard, shadows.card]}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonBadge}>FASTEST</Text>
              <Text style={styles.comparisonFare}>₱24</Text>
            </View>
            <Text style={styles.comparisonDuration}>⏱ 32 min · 1 transfer</Text>
            <Text style={styles.comparisonWalk}>🚶 300m walking distance</Text>
          </View>
          <Mascot size={70} mood="thinking" showBadge={false} style={styles.smallMascot} />
        </View>
      ),
    },
    {
      title: 'Travel with confidence.',
      description:
        'Follow clear step-by-step turn and transfer instructions from start to arrival.',
      renderVisual: () => (
        <View style={styles.visualContainer}>
          <View style={[styles.timelinePreview, shadows.card]}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineIcon}>🟢</Text>
              <Text style={styles.timelineText}>Board at UP Vinzons Hall</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <Text style={styles.timelineIcon}>🔄</Text>
              <Text style={styles.timelineText}>Transfer at Philcoa Footbridge</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <Text style={styles.timelineIcon}>🏁</Text>
              <Text style={styles.timelineText}>Arrive at SM North EDSA</Text>
            </View>
          </View>
          <Mascot size={64} mood="navigating" showBadge={true} style={styles.smallMascot} />
        </View>
      ),
    },
  ];

  const handleNext = (): void => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLast = currentSlide === slides.length - 1;
  const slide = slides[currentSlide]!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>BiyaEase</Text>
        </View>
        {!isLast ? (
          <TouchableOpacity
            onPress={onComplete}
            activeOpacity={0.7}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Main Slide Content */}
      <View style={styles.content}>
        {slide.renderVisual()}

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      {/* Footer Controls & Dots */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentSlide(idx)}
              style={[styles.dot, currentSlide === idx && styles.activeDot]}
              accessibilityLabel={`Go to slide ${idx + 1}`}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {currentSlide > 0 && (
            <SecondaryButton
              title="Back"
              onPress={() => setCurrentSlide((prev) => prev - 1)}
              style={styles.backButton}
            />
          )}
          <PrimaryButton
            title={isLast ? 'Get Started 🚀' : 'Next →'}
            onPress={handleNext}
            style={currentSlide === 0 ? { width: '100%' } : styles.primaryButton}
          />
        </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  brandPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  brandPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  skipButton: {
    padding: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  skipPlaceholder: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    width: width * 0.8,
  },
  transitChipsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  comparisonCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  comparisonBadge: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comparisonFare: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  comparisonDuration: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  comparisonWalk: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  smallMascot: {
    marginTop: spacing.md,
  },
  timelinePreview: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  timelineText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineLine: {
    width: 2,
    height: 14,
    backgroundColor: colors.border,
    marginLeft: 6,
    marginVertical: 2,
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
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
});
