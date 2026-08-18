import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { CommunityReport, reportsApiService } from '../../services/reportsApiService';
import { REPORT_CATEGORIES } from './ReportTypeSelector';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;

interface ReportCardProps {
  report: CommunityReport;
  onConfirmed?: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onConfirmed }) => {
  const [confirmedCount, setConfirmedCount] = useState(report.confirmed_count);
  const [isConfirming, setIsConfirming] = useState(false);

  const categoryMeta = REPORT_CATEGORIES.find((c) => c.id === report.type) || {
    id: 'other',
    label: report.type,
    icon: '📢',
    badgeBg: '#F3F4F6',
    badgeColor: '#374151',
  };

  const formattedDistance =
    typeof report.distance_meters === 'number'
      ? report.distance_meters < 1000
        ? `${Math.round(report.distance_meters)} m away`
        : `${(report.distance_meters / 1000).toFixed(1)} km away`
      : '';

  const minutesAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(report.created_at).getTime()) / 60000)
  );

  const handleConfirm = async () => {
    setIsConfirming(true);
    const res = await reportsApiService.confirmReport(report.id);
    setIsConfirming(false);

    if (res.success && res.data) {
      setConfirmedCount(res.data.confirmedCount);
      if (onConfirmed) onConfirmed();
    } else {
      Alert.alert('Report Confirmation', res.error || 'Could not confirm report.');
    }
  };

  return (
    <RNView style={[styles.card, shadows.subtle]}>
      <RNView style={styles.topRow}>
        <RNView
          style={[
            styles.badge,
            { backgroundColor: categoryMeta.badgeBg, borderColor: categoryMeta.badgeColor },
          ]}
        >
          <RNText style={styles.badgeIcon}>{categoryMeta.icon}</RNText>
          <RNText style={[styles.badgeText, { color: categoryMeta.badgeColor }]}>
            {categoryMeta.label}
          </RNText>
        </RNView>

        <RNView style={styles.timeDistanceRow}>
          {formattedDistance ? (
            <RNText style={styles.distanceText}>{formattedDistance}</RNText>
          ) : null}
          <RNText style={styles.timeText}>{minutesAgo}m ago</RNText>
        </RNView>
      </RNView>

      <RNText style={styles.title}>{report.title}</RNText>

      {report.description ? <RNText style={styles.description}>{report.description}</RNText> : null}

      <RNView style={styles.footerRow}>
        <RNText style={styles.authorText}>Reported by {report.author_name || 'Commuter'}</RNText>

        <RNTouchableOpacity
          style={[styles.confirmBtn, isConfirming && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={isConfirming}
        >
          <RNText style={styles.confirmBtnText}>👍 Confirm ({confirmedCount})</RNText>
        </RNTouchableOpacity>
      </RNView>
    </RNView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
  },
  timeDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  timeText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  authorText: {
    fontSize: typography.fontSize.xxs,
    color: colors.textMuted,
  },
  confirmBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  confirmBtnText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
