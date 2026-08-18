import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { JourneyStep } from '../../types/journey.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

interface JourneyProgressProps {
  steps: JourneyStep[];
  currentStepIndex: number;
}

const getStepIcon = (type: string, mode?: string): string => {
  if (type === 'walk' || type === 'destination') return '🚶';
  if (type === 'board') return '🚏';
  if (type === 'alight') return '🔔';
  if (mode === 'jeepney') return '🚐';
  if (mode === 'bus') return '🚌';
  if (mode === 'mrt' || mode === 'lrt') return '🚆';
  if (mode === 'uvexpress') return '🚐';
  return '🚌';
};

export const JourneyProgress: React.FC<JourneyProgressProps> = ({ steps, currentStepIndex }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex || step.completed;
          const isActive = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isCompleted && styles.connectorCompleted,
                    isActive && styles.connectorActive,
                  ]}
                />
              )}

              {/* Step Node Pill */}
              <View
                style={[
                  styles.nodePill,
                  isCompleted && styles.nodeCompleted,
                  isActive && styles.nodeActive,
                  isPending && styles.nodePending,
                ]}
              >
                <Text style={styles.stepIcon}>{getStepIcon(step.type, step.mode)}</Text>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.labelCompleted,
                    isActive && styles.labelActive,
                    isPending && styles.labelPending,
                  ]}
                  numberOfLines={1}
                >
                  {step.type === 'walk'
                    ? 'Walk'
                    : step.type === 'board'
                      ? 'Board'
                      : step.type === 'transit'
                        ? 'Ride'
                        : step.type === 'alight'
                          ? 'Get Off'
                          : 'Arrive'}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  connectorLine: {
    width: 18,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  connectorCompleted: {
    backgroundColor: colors.success,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  nodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  nodeCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  nodeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  nodePending: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
  },
  stepIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  stepLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
  },
  labelCompleted: {
    color: colors.success,
  },
  labelActive: {
    color: colors.textInverse,
  },
  labelPending: {
    color: colors.textMuted,
  },
});
