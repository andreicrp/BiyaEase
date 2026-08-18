import { SavedPlace, SavedPlaceCategory, SavedPlacesRepository } from '../types/savedData.types';
import { localStorageService } from '../services/localStorageService';
import { calculateDistanceMeters } from '../utils/geoUtils';

const STORAGE_KEY = 'biyaease.savedPlaces.v1';
const MAX_SAVED_PLACES_LIMIT = 50;

function isValidCategory(cat: any): cat is SavedPlaceCategory {
  return ['home', 'work', 'school', 'favorite', 'other'].includes(cat);
}

export class LocalSavedPlacesRepository implements SavedPlacesRepository {
  async getAll(): Promise<SavedPlace[]> {
    const rawPlaces = await localStorageService.getItem<any[]>(STORAGE_KEY, []);
    if (!Array.isArray(rawPlaces)) {
      return [];
    }

    // Validate each stored place safely
    const validPlaces: SavedPlace[] = rawPlaces.filter((p) => {
      return (
        p &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        p.name.trim().length > 0 &&
        typeof p.latitude === 'number' &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        typeof p.longitude === 'number' &&
        p.longitude >= -180 &&
        p.longitude <= 180 &&
        isValidCategory(p.category)
      );
    });

    return this.sortPlaces(validPlaces);
  }

  async getById(id: string): Promise<SavedPlace | null> {
    const places = await this.getAll();
    return places.find((p) => p.id === id) || null;
  }

  async save(
    placeInput: SavedPlace,
    options?: { forceReplaceCategory?: boolean }
  ): Promise<{
    success: boolean;
    place?: SavedPlace;
    requiresReplace?: 'home' | 'work';
    error?: string;
  }> {
    // 1. Validation
    if (!placeInput.name || placeInput.name.trim().length === 0) {
      return { success: false, error: 'Saved place name cannot be empty' };
    }
    if (
      typeof placeInput.latitude !== 'number' ||
      placeInput.latitude < -90 ||
      placeInput.latitude > 90
    ) {
      return { success: false, error: 'Invalid latitude coordinate' };
    }
    if (
      typeof placeInput.longitude !== 'number' ||
      placeInput.longitude < -180 ||
      placeInput.longitude > 180
    ) {
      return { success: false, error: 'Invalid longitude coordinate' };
    }

    const category: SavedPlaceCategory = isValidCategory(placeInput.category)
      ? placeInput.category
      : 'favorite';

    const places = await this.getAll();

    // 2. Limit Check
    if (places.length >= MAX_SAVED_PLACES_LIMIT && !places.some((p) => p.id === placeInput.id)) {
      return {
        success: false,
        error: `Maximum limit of ${MAX_SAVED_PLACES_LIMIT} saved places reached.`,
      };
    }

    // 3. Deduplication Check (Same normalized name AND coordinates within 30m)
    const normalizedInputName = placeInput.name.trim().toLowerCase();
    const existingDuplicate = places.find((p) => {
      const sameName = p.name.trim().toLowerCase() === normalizedInputName;
      const dist = calculateDistanceMeters(
        { latitude: p.latitude, longitude: p.longitude },
        { latitude: placeInput.latitude, longitude: placeInput.longitude }
      );
      return sameName && dist <= 30;
    });

    if (existingDuplicate && existingDuplicate.id !== placeInput.id) {
      return { success: true, place: existingDuplicate };
    }

    // 4. Home / Work Uniqueness Check
    if (category === 'home' || category === 'work') {
      const existingSpecial = places.find((p) => p.category === category && p.id !== placeInput.id);

      if (existingSpecial) {
        if (!options?.forceReplaceCategory) {
          return {
            success: false,
            requiresReplace: category,
            error: `An existing location is already set as ${category === 'home' ? 'Home' : 'Work'}. Replace it?`,
          };
        } else {
          // Change previous Home/Work location to 'favorite'
          existingSpecial.category = 'favorite';
          existingSpecial.updatedAt = Date.now();
        }
      }
    }

    // 5. Construct & Store Place Object
    const now = Date.now();
    const newPlace: SavedPlace = {
      id: placeInput.id || `sp_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: placeInput.name.trim(),
      latitude: placeInput.latitude,
      longitude: placeInput.longitude,
      subtitle: placeInput.subtitle || undefined,
      type: placeInput.type || 'place',
      category,
      createdAt: placeInput.createdAt || now,
      updatedAt: now,
    };

    const updatedList = places.filter((p) => p.id !== newPlace.id);
    updatedList.push(newPlace);

    await localStorageService.setItem(STORAGE_KEY, updatedList);
    return { success: true, place: newPlace };
  }

  async update(place: SavedPlace): Promise<{ success: boolean; error?: string }> {
    const res = await this.save(place, { forceReplaceCategory: true });
    return { success: res.success, error: res.error };
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const places = await this.getAll();
    const filtered = places.filter((p) => p.id !== id);
    await localStorageService.setItem(STORAGE_KEY, filtered);
    return { success: true };
  }

  private sortPlaces(places: SavedPlace[]): SavedPlace[] {
    const categoryRank: Record<SavedPlaceCategory, number> = {
      home: 0,
      work: 1,
      school: 2,
      favorite: 3,
      other: 4,
    };

    return [...places].sort((a, b) => {
      const rankA = categoryRank[a.category] ?? 4;
      const rankB = categoryRank[b.category] ?? 4;

      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }
}

export const localSavedPlacesRepository = new LocalSavedPlacesRepository();
