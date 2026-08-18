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
import { SavedPlace, SavedPlaceCategory } from '../types/savedData.types';
import { SelectedLocation } from '../types/search.types';

const RNView = View as any;
const RNText = Text as any;
const RNTouchableOpacity = TouchableOpacity as any;
const RNModal = Modal as any;
const RNTextInput = TextInput as any;

interface SavedPlacesScreenProps {
  onSelectAsOrigin?: (location: SelectedLocation) => void;
  onSelectAsDestination?: (location: SelectedLocation) => void;
  onBack?: () => void;
}

export const SavedPlacesScreen: React.FC<SavedPlacesScreenProps> = ({
  onSelectAsOrigin,
  onSelectAsDestination,
}) => {
  const { savedPlaces, savePlace, updatePlace, deletePlace } = useSavedData();

  const [activePlace, setActivePlace] = useState<SavedPlace | null>(null);
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Edit State
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<SavedPlaceCategory>('favorite');

  // Add State
  const [addName, setAddName] = useState<string>('');
  const [addSubtitle, setAddSubtitle] = useState<string>('');
  const [addLat, setAddLat] = useState<string>('14.6538');
  const [addLng, setAddLng] = useState<string>('121.0685');
  const [addCategory, setAddCategory] = useState<SavedPlaceCategory>('favorite');

  const getCategoryIcon = (cat: SavedPlaceCategory): string => {
    switch (cat) {
      case 'home':
        return '🏠';
      case 'work':
        return '💼';
      case 'school':
        return '🎓';
      case 'favorite':
        return '⭐';
      default:
        return '📍';
    }
  };

  const getCategoryLabel = (cat: SavedPlaceCategory): string => {
    switch (cat) {
      case 'home':
        return 'Home';
      case 'work':
        return 'Work';
      case 'school':
        return 'School';
      case 'favorite':
        return 'Favorites';
      default:
        return 'Other Places';
    }
  };

  const handleCardPress = (place: SavedPlace) => {
    setActivePlace(place);
    setShowActionModal(true);
  };

  const handleUseAsOrigin = () => {
    if (activePlace && onSelectAsOrigin) {
      onSelectAsOrigin({
        id: activePlace.id,
        name: activePlace.name,
        type: activePlace.type || 'place',
        latitude: activePlace.latitude,
        longitude: activePlace.longitude,
        subtitle: activePlace.subtitle,
      });
    }
    setShowActionModal(false);
  };

  const handleUseAsDestination = () => {
    if (activePlace && onSelectAsDestination) {
      onSelectAsDestination({
        id: activePlace.id,
        name: activePlace.name,
        type: activePlace.type || 'place',
        latitude: activePlace.latitude,
        longitude: activePlace.longitude,
        subtitle: activePlace.subtitle,
      });
    }
    setShowActionModal(false);
  };

  const handleOpenEdit = () => {
    if (activePlace) {
      setEditName(activePlace.name);
      setEditCategory(activePlace.category);
      setShowActionModal(false);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!activePlace || !editName.trim()) return;

    const res = await updatePlace({
      ...activePlace,
      name: editName.trim(),
      category: editCategory,
      updatedAt: Date.now(),
    });

    if (res.success) {
      setShowEditModal(false);
      setActivePlace(null);
    } else {
      Alert.alert('Error', res.error || 'Failed to update place');
    }
  };

  const handleOpenDelete = () => {
    setShowActionModal(false);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (activePlace) {
      await deletePlace(activePlace.id);
      setShowDeleteConfirmModal(false);
      setActivePlace(null);
    }
  };

  const handleCreatePlace = async () => {
    if (!addName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for the saved place');
      return;
    }

    const lat = parseFloat(addLat);
    const lng = parseFloat(addLng);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert(
        'Validation Error',
        'Please enter valid latitude (-90 to 90) and longitude (-180 to 180)'
      );
      return;
    }

    const res = await savePlace({
      name: addName.trim(),
      subtitle: addSubtitle.trim() || undefined,
      latitude: lat,
      longitude: lng,
      category: addCategory,
      type: 'place',
    });

    if (res.success) {
      setShowAddModal(false);
      setAddName('');
      setAddSubtitle('');
    } else if (res.requiresReplace) {
      Alert.alert('Replace Existing Location?', res.error, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            await savePlace(
              {
                name: addName.trim(),
                subtitle: addSubtitle.trim() || undefined,
                latitude: lat,
                longitude: lng,
                category: addCategory,
                type: 'place',
              },
              { forceReplaceCategory: true }
            );
            setShowAddModal(false);
            setAddName('');
            setAddSubtitle('');
          },
        },
      ]);
    } else {
      Alert.alert('Error', res.error || 'Failed to save place');
    }
  };

  const categoriesOrder: SavedPlaceCategory[] = ['home', 'work', 'school', 'favorite', 'other'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Header */}
      <RNView style={styles.header}>
        <RNText style={styles.headerTitle}>Saved Places</RNText>
        <RNTouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          accessibilityLabel="Add new saved place"
        >
          <RNText style={styles.addButtonText}>+ Add Place</RNText>
        </RNTouchableOpacity>
      </RNView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {savedPlaces.length === 0 ? (
          <RNView style={styles.emptyState}>
            <RNText style={styles.emptyIcon}>📍</RNText>
            <RNText style={styles.emptyTitle}>No Saved Places Yet</RNText>
            <RNText style={styles.emptySubtitle}>
              Save your Home, Work, School, or favorite spots for 1-tap commute planning.
            </RNText>
            <RNTouchableOpacity style={styles.emptyAddButton} onPress={() => setShowAddModal(true)}>
              <RNText style={styles.emptyAddButtonText}>+ Save Your First Place</RNText>
            </RNTouchableOpacity>
          </RNView>
        ) : (
          categoriesOrder.map((cat) => {
            const catPlaces = savedPlaces.filter((p) => p.category === cat);
            if (catPlaces.length === 0) return null;

            return (
              <RNView key={`cat-${cat}`} style={styles.sectionContainer}>
                <RNView style={styles.sectionHeader}>
                  <RNText style={styles.sectionIcon}>{getCategoryIcon(cat)}</RNText>
                  <RNText style={styles.sectionTitle}>{getCategoryLabel(cat)}</RNText>
                </RNView>

                {catPlaces.map((place) => (
                  <RNTouchableOpacity
                    key={place.id}
                    style={[styles.placeCard, shadows.card]}
                    onPress={() => handleCardPress(place)}
                    activeOpacity={0.7}
                  >
                    <RNView style={styles.cardIconBox}>
                      <RNText style={styles.cardIcon}>{getCategoryIcon(place.category)}</RNText>
                    </RNView>

                    <RNView style={styles.cardInfo}>
                      <RNText style={styles.placeName} numberOfLines={1}>
                        {place.name}
                      </RNText>
                      {place.subtitle && (
                        <RNText style={styles.placeSubtitle} numberOfLines={1}>
                          {place.subtitle}
                        </RNText>
                      )}
                      <RNText style={styles.placeCoords}>
                        {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                      </RNText>
                    </RNView>

                    <RNText style={styles.threeDots}>⋮</RNText>
                  </RNTouchableOpacity>
                ))}
              </RNView>
            );
          })
        )}
      </ScrollView>

      {/* Action Sheet Modal */}
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
            <RNText style={styles.actionModalTitle}>{activePlace?.name}</RNText>
            {activePlace?.subtitle && (
              <RNText style={styles.actionModalSub}>{activePlace.subtitle}</RNText>
            )}

            <RNTouchableOpacity style={styles.actionOptionBtn} onPress={handleUseAsOrigin}>
              <RNText style={styles.actionOptionIcon}>🟢</RNText>
              <RNText style={styles.actionOptionText}>Set as Origin</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity style={styles.actionOptionBtn} onPress={handleUseAsDestination}>
              <RNText style={styles.actionOptionIcon}>🎯</RNText>
              <RNText style={styles.actionOptionText}>Set as Destination</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity style={styles.actionOptionBtn} onPress={handleOpenEdit}>
              <RNText style={styles.actionOptionIcon}>✏️</RNText>
              <RNText style={styles.actionOptionText}>Edit Location</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity
              style={[styles.actionOptionBtn, styles.deleteOptionBtn]}
              onPress={handleOpenDelete}
            >
              <RNText style={styles.actionOptionIcon}>🗑️</RNText>
              <RNText style={[styles.actionOptionText, styles.deleteOptionText]}>
                Delete Location
              </RNText>
            </RNTouchableOpacity>
          </RNView>
        </RNTouchableOpacity>
      </RNModal>

      {/* Edit Place Modal */}
      <RNModal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.dialogModalContainer}>
            <RNText style={styles.dialogTitle}>Edit Saved Place</RNText>

            <RNText style={styles.fieldLabel}>NAME</RNText>
            <RNTextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Apartment, Work, SM Mall"
            />

            <RNText style={styles.fieldLabel}>CATEGORY</RNText>
            <RNView style={styles.categoryPickerRow}>
              {categoriesOrder.map((cat) => (
                <RNTouchableOpacity
                  key={`picker-${cat}`}
                  style={[styles.categoryChip, editCategory === cat && styles.categoryChipActive]}
                  onPress={() => setEditCategory(cat)}
                >
                  <RNText
                    style={[
                      styles.categoryChipText,
                      editCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {getCategoryIcon(cat)} {cat.toUpperCase()}
                  </RNText>
                </RNTouchableOpacity>
              ))}
            </RNView>

            <RNView style={styles.dialogActions}>
              <RNTouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <RNText style={styles.cancelBtnText}>Cancel</RNText>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <RNText style={styles.saveBtnText}>Save Changes</RNText>
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
            <RNText style={styles.dialogTitle}>Remove Saved Place?</RNText>
            <RNText style={styles.dialogSub}>
              Remove "{activePlace?.name}" from your Saved Places list?
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

      {/* Add New Place Modal */}
      <RNModal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.dialogModalContainer}>
            <RNText style={styles.dialogTitle}>Save New Location</RNText>

            <RNText style={styles.fieldLabel}>LOCATION NAME</RNText>
            <RNTextInput
              style={styles.textInput}
              value={addName}
              onChangeText={setAddName}
              placeholder="e.g. UP Diliman, SM North EDSA"
            />

            <RNText style={styles.fieldLabel}>SUBTITLE / ADDRESS (OPTIONAL)</RNText>
            <RNTextInput
              style={styles.textInput}
              value={addSubtitle}
              onChangeText={setAddSubtitle}
              placeholder="e.g. Diliman, Quezon City"
            />

            <RNView style={styles.coordRow}>
              <RNView style={styles.coordCol}>
                <RNText style={styles.fieldLabel}>LATITUDE</RNText>
                <RNTextInput
                  style={styles.textInput}
                  value={addLat}
                  onChangeText={setAddLat}
                  keyboardType="numeric"
                />
              </RNView>
              <RNView style={styles.coordCol}>
                <RNText style={styles.fieldLabel}>LONGITUDE</RNText>
                <RNTextInput
                  style={styles.textInput}
                  value={addLng}
                  onChangeText={setAddLng}
                  keyboardType="numeric"
                />
              </RNView>
            </RNView>

            <RNText style={styles.fieldLabel}>CATEGORY</RNText>
            <RNView style={styles.categoryPickerRow}>
              {categoriesOrder.map((cat) => (
                <RNTouchableOpacity
                  key={`add-cat-${cat}`}
                  style={[styles.categoryChip, addCategory === cat && styles.categoryChipActive]}
                  onPress={() => setAddCategory(cat)}
                >
                  <RNText
                    style={[
                      styles.categoryChipText,
                      addCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {getCategoryIcon(cat)} {cat.toUpperCase()}
                  </RNText>
                </RNTouchableOpacity>
              ))}
            </RNView>

            <RNView style={styles.dialogActions}>
              <RNTouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <RNText style={styles.cancelBtnText}>Cancel</RNText>
              </RNTouchableOpacity>
              <RNTouchableOpacity style={styles.saveBtn} onPress={handleCreatePlace}>
                <RNText style={styles.saveBtnText}>Save Location</RNText>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#0F766E',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  emptyAddButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.fontSize.sm,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeSubtitle: {
    fontSize: typography.fontSize.xxs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  placeCoords: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  threeDots: {
    fontSize: 18,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
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
    backgroundColor: colors.cardAlt,
    minHeight: 44,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordCol: {
    flex: 0.48,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
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
