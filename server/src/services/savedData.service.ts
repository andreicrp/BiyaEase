import { savedDataRepository } from '../repositories/savedData.repository.js';
import { logger } from '../utils/logger.js';

export interface SavedPlacePayload {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  category: string;
  locationType?: string;
}

export interface FavoriteRoutePayload {
  id: string;
  displayName?: string;
  name?: string;
  origin: { id: string; name: string; latitude: number; longitude: number };
  destination: { id: string; name: string; latitude: number; longitude: number };
  journeyReference?: any;
  modeSummary?: string[];
  estimatedDurationMinutes?: number;
  estimatedFare?: number;
}

export class SavedDataService {
  async getSavedPlaces(userId: string) {
    return savedDataRepository.getSavedPlacesByUserId(userId);
  }

  async savePlace(userId: string, payload: SavedPlacePayload) {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Saved place name cannot be empty');
    }
    if (
      payload.latitude < -90 ||
      payload.latitude > 90 ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      throw new Error('Invalid coordinate boundaries');
    }

    return savedDataRepository.saveSavedPlace({
      id: payload.id || `sp-${Date.now()}`,
      userId,
      name: payload.name.trim(),
      latitude: payload.latitude,
      longitude: payload.longitude,
      subtitle: payload.subtitle,
      category: payload.category || 'favorite',
      locationType: payload.locationType || 'place',
    });
  }

  async deletePlace(userId: string, id: string) {
    return savedDataRepository.deleteSavedPlace(id, userId);
  }

  async getFavoriteRoutes(userId: string) {
    return savedDataRepository.getFavoriteRoutesByUserId(userId);
  }

  async saveFavoriteRoute(userId: string, payload: FavoriteRoutePayload) {
    const name = payload.displayName || payload.name;
    if (!name || name.trim().length === 0) {
      throw new Error('Favorite route display name cannot be empty');
    }
    if (!payload.origin || typeof payload.origin.latitude !== 'number') {
      throw new Error('Invalid origin location payload');
    }
    if (!payload.destination || typeof payload.destination.latitude !== 'number') {
      throw new Error('Invalid destination location payload');
    }

    return savedDataRepository.saveFavoriteRoute({
      id: payload.id || `fr-${Date.now()}`,
      userId,
      displayName: name.trim(),
      origin: payload.origin,
      destination: payload.destination,
      journeyReference: payload.journeyReference,
      modeSummary: payload.modeSummary,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      estimatedFare: payload.estimatedFare,
    });
  }

  async deleteFavoriteRoute(userId: string, id: string) {
    return savedDataRepository.deleteFavoriteRoute(id, userId);
  }

  async syncLocalPlaces(userId: string, localPlaces: SavedPlacePayload[]) {
    if (!Array.isArray(localPlaces) || localPlaces.length === 0) {
      return this.getSavedPlaces(userId);
    }

    logger.info(`[SYNC] Merging ${localPlaces.length} local saved places for user ${userId}`);
    for (const place of localPlaces) {
      try {
        await this.savePlace(userId, place);
      } catch {
        // Skip invalid local entries during batch sync
      }
    }

    return this.getSavedPlaces(userId);
  }

  async syncLocalRoutes(userId: string, localRoutes: FavoriteRoutePayload[]) {
    if (!Array.isArray(localRoutes) || localRoutes.length === 0) {
      return this.getFavoriteRoutes(userId);
    }

    logger.info(`[SYNC] Merging ${localRoutes.length} local favorite routes for user ${userId}`);
    for (const route of localRoutes) {
      try {
        await this.saveFavoriteRoute(userId, route);
      } catch {
        // Skip invalid local entries during batch sync
      }
    }

    return this.getFavoriteRoutes(userId);
  }
}

export const savedDataService = new SavedDataService();
