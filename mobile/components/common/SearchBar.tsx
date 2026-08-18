import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius, shadows } from '../../constants/spacing';

interface SearchBarProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search destination (e.g. SM North, UP Diliman)',
  onPress,
  onClear,
  autoFocus = false,
  editable = true,
  style,
}) => {
  const content = (
    <View style={[styles.container, shadows.subtle, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search input"
      />
      {value.length > 0 && editable && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear || (() => onChangeText?.(''))}
          activeOpacity={0.7}
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!editable && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
