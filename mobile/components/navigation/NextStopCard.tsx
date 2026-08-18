import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { NextStopInfo } from '../../navigation/navigationTypes';

interface NextStopCardProps {
  nextStopInfo: NextStopInfo;
  mode?: string;
  routeCode?: string;
}

export const NextStopCard: React.FC<NextStopCardProps> = ({
  nextStopInfo,
  mode = 'transit',
  routeCode,
}) => {
  const isApproaching = nextStopInfo.isApproachingAlight;

  return (
    <View style={[styles.card, isApproaching && styles.cardApproaching, shadows.subtle]}>
      <View style={styles.headerRow}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {mode.toUpperCase()} {routeCode ? `· ${routeCode}` : ''}
          </Text>
        </View>
        <Text style={[styles.stopsRemaining, isApproaching && styles.stopsRemainingUrgent]}>
          {nextStopInfo.stopsRemaining === 1
            ? '🏁 Next stop is your alight stop'
            : `🚏 ${nextStopInfo.stopsRemaining} stops remaining`}
        </Text>
      </View>

      <View style={styles.stopDetailsRow}>
        <View style={styles.stopNameGroup}>
          <Text style={styles.captionText}>NEXT STOP</Text>
          <Text style={styles.stopName} numberOfLines={1}>
            {nextStopInfo.nextStopName || 'Upcoming Stop'}
          </Text>
        </View>

        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {nextStopInfo.distanceToNextStopMeters < 1000
              ? `${nextStopInfo.distanceToNextStopMeters}m`
              : `${(nextStopInfo.distanceToNextStopMeters / 1000).toFixed(1)}km`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardApproaching: {
    borderColor: colors.accent,
    backgroundColor: '#FFFBEB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modeBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  stopsRemaining: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stopsRemainingUrgent: {
    color: '#D97706',
    fontWeight: '800',
  },
  stopDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopNameGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  captionText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stopName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  distanceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
