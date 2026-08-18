import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { ReportCategory } from '../../services/reportsApiService';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;

export interface CategoryOption {
  id: ReportCategory;
  label: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
}

export const REPORT_CATEGORIES: CategoryOption[] = [
  {
    id: 'traffic',
    label: 'Heavy Traffic',
    icon: '🚨',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
  },
  {
    id: 'crowding',
    label: 'Station Crowded',
    icon: '👥',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
  },
  {
    id: 'unavailable',
    label: 'Vehicle Full',
    icon: '🚐',
    badgeBg: '#E0E7FF',
    badgeColor: '#3730A3',
  },
  {
    id: 'delay',
    label: 'Trip Delay',
    icon: '⏳',
    badgeBg: '#FFEDD5',
    badgeColor: '#9A3412',
  },
  {
    id: 'road_blocked',
    label: 'Road Blocked',
    icon: '🛑',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
  },
  {
    id: 'fare_change',
    label: 'Fare Changed',
    icon: '💸',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46',
  },
  {
    id: 'stop_issue',
    label: 'Stop Moved',
    icon: '🚏',
    badgeBg: '#F3E8FF',
    badgeColor: '#6B21A8',
  },
  {
    id: 'other',
    label: 'Other Alert',
    icon: '📢',
    badgeBg: '#F3F4F6',
    badgeColor: '#374151',
  },
];

interface ReportTypeSelectorProps {
  selectedType: ReportCategory;
  onSelectType: (type: ReportCategory) => void;
}

export const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  return (
    <RNView style={styles.grid}>
      {REPORT_CATEGORIES.map((cat) => {
        const isSelected = selectedType === cat.id;
        return (
          <RNTouchableOpacity
            key={cat.id}
            style={[
              styles.card,
              shadows.subtle,
              isSelected && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
            ]}
            onPress={() => onSelectType(cat.id)}
            activeOpacity={0.7}
          >
            <RNText style={styles.icon}>{cat.icon}</RNText>
            <RNText style={[styles.label, isSelected && { color: colors.primaryDark }]}>
              {cat.label}
            </RNText>
          </RNTouchableOpacity>
        );
      })}
    </RNView>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
});
