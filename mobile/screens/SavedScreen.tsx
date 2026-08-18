import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { SavedPlacesScreen } from './SavedPlacesScreen';
import { FavoriteRoutesScreen } from './FavoriteRoutesScreen';
import { SelectedLocation } from '../types/search.types';
import { SavedLocationReference } from '../types/savedData.types';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;

interface SavedScreenProps {
  onSelectAsOrigin?: (location: SelectedLocation) => void;
  onSelectAsDestination?: (location: SelectedLocation) => void;
  onLaunchFavoriteRoute?: (locations: {
    origin: SavedLocationReference;
    destination: SavedLocationReference;
  }) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  onSelectAsOrigin,
  onSelectAsDestination,
  onLaunchFavoriteRoute,
}) => {
  const [activeTab, setActiveTab] = useState<'places' | 'routes'>('places');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Segment Switcher Bar */}
      <RNView style={styles.tabBarContainer}>
        <RNTouchableOpacity
          style={[styles.tabButton, activeTab === 'places' && styles.tabButtonActive]}
          onPress={() => setActiveTab('places')}
          accessibilityLabel="View Saved Places"
        >
          <RNText
            style={[styles.tabButtonText, activeTab === 'places' && styles.tabButtonTextActive]}
          >
            📍 Saved Places
          </RNText>
        </RNTouchableOpacity>

        <RNTouchableOpacity
          style={[styles.tabButton, activeTab === 'routes' && styles.tabButtonActive]}
          onPress={() => setActiveTab('routes')}
          accessibilityLabel="View Favorite Routes"
        >
          <RNText
            style={[styles.tabButtonText, activeTab === 'routes' && styles.tabButtonTextActive]}
          >
            ⭐ Favorite Routes
          </RNText>
        </RNTouchableOpacity>
      </RNView>

      {/* Screen Body */}
      <RNView style={styles.body}>
        {activeTab === 'places' ? (
          <SavedPlacesScreen
            onSelectAsOrigin={onSelectAsOrigin}
            onSelectAsDestination={onSelectAsDestination}
          />
        ) : (
          <FavoriteRoutesScreen onLaunchRoute={onLaunchFavoriteRoute} />
        )}
      </RNView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    marginHorizontal: 2,
    minHeight: 44,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
});
