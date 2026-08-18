import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/spacing';
import { useSavedData } from '../context/SavedDataContext';
import { FavoriteRoute, SavedLocationReference } from '../types/savedData.types';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;
const RNModal = Modal as any;
const RNTextInput = TextInput as any;

interface FavoriteRoutesScreenProps {
  onLaunchRoute?: (locations: {
    origin: SavedLocationReference;
    destination: SavedLocationReference;
  }) => void;
  onBack?: () => void;
}

export const FavoriteRoutesScreen: React.FC<FavoriteRoutesScreenProps> = ({ onLaunchRoute }) => {
  const { favoriteRoutes, updateRoute, deleteRoute, launchFavoriteRoute } = useSavedData();

  const [activeRoute, setActiveRoute] = useState<FavoriteRoute | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');

  const handleRoutePress = async (route: FavoriteRoute) => {
    setActiveRoute(route);
    setShowActionModal(true);
  };

  const handleLaunch = async () => {
    if (activeRoute) {
      setShowActionModal(false);
      const payload = await launchFavoriteRoute(activeRoute);
      if (onLaunchRoute) {
        onLaunchRoute(payload);
      }
    }
  };

  const handleOpenRename = () => {
    if (activeRoute) {
      setRenameValue(activeRoute.name);
      setShowActionModal(false);
      setShowRenameModal(true);
    }
  };

  const handleSaveRename = async () => {
    if (!activeRoute || !renameValue.trim()) return;

    const res = await updateRoute({
      ...activeRoute,
      name: renameValue.trim(),
      updatedAt: Date.now(),
    });

    if (res.success) {
      setShowRenameModal(false);
      setActiveRoute(null);
    } else {
      Alert.alert('Error', res.error || 'Failed to rename route');
    }
  };

  const handleOpenDelete = () => {
    setShowActionModal(false);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (activeRoute) {
      await deleteRoute(activeRoute.id);
      setShowDeleteConfirmModal(false);
      setActiveRoute(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Header */}
      <RNView style={styles.header}>
        <RNText style={styles.headerTitle}>Favorite Routes</RNText>
      </RNView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {favoriteRoutes.length === 0 ? (
          <RNView style={styles.emptyState}>
            <RNText style={styles.emptyIcon}>⭐</RNText>
            <RNText style={styles.emptyTitle}>No Favorite Routes Saved</RNText>
            <RNText style={styles.emptySubtitle}>
              Save your daily commutes (e.g. Home ➔ Work, School ➔ Cubao) from Route Options for
              1-tap route calculation.
            </RNText>
          </RNView>
        ) : (
          favoriteRoutes.map((route) => (
            <RNTouchableOpacity
              key={route.id}
              style={[styles.routeCard, shadows.card]}
              onPress={() => handleRoutePress(route)}
              activeOpacity={0.75}
            >
              <RNView style={styles.routeHeaderRow}>
                <RNText style={styles.routeName} numberOfLines={1}>
                  {route.name}
                </RNText>
                <RNText style={styles.threeDots}>⋮</RNText>
              </RNView>

              <RNView style={styles.pathRow}>
                <RNText style={styles.originText} numberOfLines={1}>
                  🟢 {route.origin.name}
                </RNText>
                <RNText style={styles.arrowText}>➔</RNText>
                <RNText style={styles.destText} numberOfLines={1}>
                  🎯 {route.destination.name}
                </RNText>
              </RNView>

              {/* Badges / Mode Summary */}
              <RNView style={styles.metaRow}>
                {route.modeSummary && route.modeSummary.length > 0 && (
                  <RNView style={styles.modeBadgeContainer}>
                    <RNText style={styles.modeBadgeText}>{route.modeSummary.join(' › ')}</RNText>
                  </RNView>
                )}

                {route.estimatedDurationMinutes && (
                  <RNView style={styles.metricBadge}>
                    <RNText style={styles.metricBadgeText}>
                      ⏱ {route.estimatedDurationMinutes}m
                    </RNText>
                  </RNView>
                )}

                {route.estimatedFare && (
                  <RNView style={styles.metricBadge}>
                    <RNText style={styles.metricBadgeText}>₱{route.estimatedFare}</RNText>
                  </RNView>
                )}
              </RNView>

              <RNTouchableOpacity style={styles.launchButton} onPress={handleLaunch}>
                <RNText style={styles.launchButtonText}>🚀 Find Current Routes</RNText>
              </RNTouchableOpacity>
            </RNTouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Action Modal */}
      <RNModal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <RNTouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <RNView style={styles.actionModalContainer}>
            <RNText style={styles.actionModalTitle}>{activeRoute?.name}</RNText>
            <RNText style={styles.actionModalSub}>
              {activeRoute?.origin.name} ➔ {activeRoute?.destination.name}
            </RNText>

            <RNTouchableOpacity style={styles.actionOptionBtn} onPress={handleLaunch}>
              <RNText style={styles.actionOptionIcon}>🚀</RNText>
              <RNText style={styles.actionOptionText}>Find Current Routes Now</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity style={styles.actionOptionBtn} onPress={handleOpenRename}>
              <RNText style={styles.actionOptionIcon}>✏️</RNText>
              <RNText style={styles.actionOptionText}>Rename Favorite Route</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity
              style={[styles.actionOptionBtn, styles.deleteOptionBtn]}
              onPress={handleOpenDelete}
            >
              <RNText style={styles.actionOptionIcon}>🗑️</RNText>
              <RNText style={[styles.actionOptionText, styles.deleteOptionText]}>
                Delete Favorite Route
              </RNText>
            </RNTouchableOpacity>
          </RNView>
        </RNTouchableOpacity>
      </RNModal>

      {/* Rename Modal */}
      <RNModal
        visible={showRenameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.dialogModalContainer}>
            <RNText style={styles.dialogTitle}>Rename Favorite Route</RNText>

            <RNText style={styles.fieldLabel}>ROUTE NAME</RNText>
            <RNTextInput
              style={styles.textInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="e.g. Daily Commute, School Route"
            />

            <RNView style={styles.dialogActions}>
              <RNTouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRenameModal(false)}
              >
                <RNText style={styles.cancelBtnText}>Cancel</RNText>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.saveBtn} onPress={handleSaveRename}>
                <RNText style={styles.saveBtnText}>Save Name</RNText>
              </RNTouchableOpacity>
            </RNView>
          </RNView>
        </RNView>
      </RNModal>

      {/* Delete Confirmation Modal */}
      <RNModal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.dialogModalContainer}>
            <RNText style={styles.dialogTitle}>Remove Favorite Route?</RNText>
            <RNText style={styles.dialogSub}>
              Remove "{activeRoute?.name}" from your Favorite Routes?
            </RNText>

            <RNView style={styles.dialogActions}>
              <RNTouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <RNText style={styles.cancelBtnText}>Cancel</RNText>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.deleteConfirmBtn} onPress={handleConfirmDelete}>
                <RNText style={styles.deleteConfirmBtnText}>Remove</RNText>
              </RNTouchableOpacity>
            </RNView>
          </RNView>
        </RNView>
      </RNModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  routeName: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  threeDots: {
    fontSize: 18,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  originText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  arrowText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  destText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  modeBadgeContainer: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metricBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  launchButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  launchButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  actionModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionModalSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 44,
  },
  actionOptionIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  actionOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteOptionBtn: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    color: colors.error,
  },
  dialogModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    padding: spacing.lg,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dialogSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xxs,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    backgroundColor: colors.cardAlt,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteConfirmBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
