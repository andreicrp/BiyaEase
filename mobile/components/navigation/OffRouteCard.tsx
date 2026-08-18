import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { OffRouteStatus } from '../../navigation/navigationTypes';

interface OffRouteCardProps {
  offRouteStatus: OffRouteStatus;
  onRecenter?: () => void;
  onContinue?: () => void;
  onRecalculate?: () => void;
}

export const OffRouteCard: React.FC<OffRouteCardProps> = ({
  offRouteStatus,
  onRecenter,
  onContinue,
  onRecalculate,
}) => {
  return (
    <View style={[styles.card, shadows.floating]}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>
            {offRouteStatus.isOffRoute ? 'Off Planned Route' : 'Wrong Direction'}
          </Text>
          <Text style={styles.subtitle}>
            {offRouteStatus.recoveryGuidance || 'Please re-align with your commute corridor.'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {onRecenter && (
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={onRecenter}>
            <Text style={styles.actionTextSecondary}>🎯 Recenter Map</Text>
          </TouchableOpacity>
        )}

        {onContinue && (
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={onContinue}>
            <Text style={styles.actionTextSecondary}>🚶 Keep Going</Text>
          </TouchableOpacity>
        )}

        {onRecalculate && (
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={onRecalculate}>
            <Text style={styles.actionTextPrimary}>🔄 Recalculate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: '#9F1239',
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: '#BE123C',
    marginTop: 2,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionBtnSecondary: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  actionTextSecondary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F1239',
  },
  actionBtnPrimary: {
    backgroundColor: '#E11D48',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  actionTextPrimary: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
