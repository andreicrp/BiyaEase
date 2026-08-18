import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { AppHeader } from '../components/common/AppHeader';
import { useAuth } from '../context/AuthContext';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;
const RNTextInput = TextInput as any;

interface LoginScreenProps {
  onBack: () => void;
  onNavigateRegister: () => void;
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onNavigateRegister,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Sign In" showBack onBack={onBack} />

      <RNView style={styles.content}>
        <RNView style={styles.headerBox}>
          <RNText style={styles.title}>Welcome Back 👋</RNText>
          <RNText style={styles.subtitle}>
            Sign in to sync your saved places and favorite commute routes across device sessions.
          </RNText>
        </RNView>

        {errorMessage && (
          <RNView style={styles.errorCard}>
            <RNText style={styles.errorIcon}>⚠️</RNText>
            <RNText style={styles.errorText}>{errorMessage}</RNText>
          </RNView>
        )}

        <RNView style={styles.formGroup}>
          <RNText style={styles.fieldLabel}>EMAIL ADDRESS</RNText>
          <RNTextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="commuter@biyaease.ph"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <RNText style={styles.fieldLabel}>PASSWORD</RNText>
          <RNTextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <RNTouchableOpacity
            style={[styles.submitBtn, shadows.subtle]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <RNText style={styles.submitBtnText}>Sign In to Account</RNText>
            )}
          </RNTouchableOpacity>
        </RNView>

        <RNView style={styles.footerRow}>
          <RNText style={styles.footerText}>Don't have an account?</RNText>
          <RNTouchableOpacity onPress={onNavigateRegister}>
            <RNText style={styles.registerLink}>Register Now</RNText>
          </RNTouchableOpacity>
        </RNView>
      </RNView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  headerBox: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.xs,
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
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: 6,
  },
  registerLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
