import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { ReportTypeSelector, REPORT_CATEGORIES } from '../components/reports/ReportTypeSelector';
import { ReportCategory, reportsApiService } from '../services/reportsApiService';
import { useAuth } from '../context/AuthContext';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;
const RNTextInput = TextInput as any;

interface ReportIssueScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({
  onBack,
  onSuccess,
  initialLatitude = 14.6538,
  initialLongitude = 121.0685,
}) => {
  const { isAuthenticated } = useAuth();
  const [selectedType, setSelectedType] = useState<ReportCategory>('traffic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expirationHours, setExpirationHours] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategory = REPORT_CATEGORIES.find((c) => c.id === selectedType);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to your BiyaEase account to post community reports.'
      );
      return;
    }

    const reportTitle = title.trim() || `${activeCategory?.label || 'Alert'} near location`;

    setIsSubmitting(true);
    const res = await reportsApiService.createReport({
      type: selectedType,
      latitude: initialLatitude,
      longitude: initialLongitude,
      title: reportTitle,
      description: description.trim() || undefined,
      expirationHours,
    });
    setIsSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Report Submitted!',
        'Salamat! Your crowd report is now live for fellow commuters.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } else {
      Alert.alert('Submission Error', res.error || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Submit Crowd Report" showBack onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <RNView style={styles.headerBox}>
          <RNText style={styles.title}>Report Commute Incident 📢</RNText>
          <RNText style={styles.subtitle}>
            Help fellow Filipino commuters by sharing real-time traffic, crowding, or transit issues
            near your location.
          </RNText>
        </RNView>

        <RNText style={styles.fieldLabel}>SELECT INCIDENT CATEGORY</RNText>
        <ReportTypeSelector selectedType={selectedType} onSelectType={setSelectedType} />

        <RNText style={styles.fieldLabel}>REPORT TITLE</RNText>
        <RNTextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder={`e.g., ${activeCategory?.label || 'Heavy Traffic'} along Katipunan Ave`}
        />

        <RNText style={styles.fieldLabel}>ADDITIONAL NOTES (OPTIONAL)</RNText>
        <RNTextInput
          style={[styles.textInput, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Long queue extending to LRT station exit. 20-30 min wait."
          multiline
          numberOfLines={3}
        />

        <RNText style={styles.fieldLabel}>DURATION (AUTO-EXPIRES AFTER)</RNText>
        <RNView style={styles.expirationRow}>
          {[1, 2, 4, 8].map((hours) => (
            <RNTouchableOpacity
              key={hours}
              style={[styles.hourChip, expirationHours === hours && styles.activeHourChip]}
              onPress={() => setExpirationHours(hours)}
            >
              <RNText
                style={[
                  styles.hourChipText,
                  expirationHours === hours && styles.activeHourChipText,
                ]}
              >
                {hours} {hours === 1 ? 'Hour' : 'Hours'}
              </RNText>
            </RNTouchableOpacity>
          ))}
        </RNView>

        <RNTouchableOpacity
          style={[styles.submitBtn, shadows.subtle]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <RNText style={styles.submitBtnText}>Publish Live Report</RNText>
          )}
        </RNTouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  expirationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  hourChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  activeHourChip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  hourChipText: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeHourChipText: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
});
