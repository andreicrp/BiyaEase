import {
  FavoriteRoute,
  FavoriteRoutesRepository,
} from '../types/savedData.types';
import { localStorageService } from '../services/localStorageService';
import { calculateDistanceMeters } from '../utils/geoUtils';

const STORAGE_KEY = 'biyaease.favoriteRoutes.v1';
const MAX_FAVORITE_ROUTES_LIMIT = 50;

export class LocalFavoriteRoutesRepository implements FavoriteRoutesRepository {
  async getAll(): Promise<FavoriteRoute[]> {
    const rawRoutes = await localStorageService.getItem<any[]>(STORAGE_KEY, []);
    if (!Array.isArray(rawRoutes)) {
      return [];
    }

    const validRoutes: FavoriteRoute[] = rawRoutes.filter((r) => {
      return (
        r &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        r.name.trim().length > 0 &&
        r.origin &&
        typeof r.origin.latitude === 'number' &&
        r.origin.latitude >= -90 &&
        r.origin.latitude <= 90 &&
        typeof r.origin.longitude === 'number' &&
        r.origin.longitude >= -180 &&
        r.origin.longitude <= 180 &&
        r.destination &&
        typeof r.destination.latitude === 'number' &&
        r.destination.latitude >= -90 &&
        r.destination.latitude <= 90 &&
        typeof r.destination.longitude === 'number' &&
        r.destination.longitude >= -180 &&
        r.destination.longitude <= 180
      );
    });

    return this.sortRoutes(validRoutes);
  }

  async getById(id: string): Promise<FavoriteRoute | null> {
    const routes = await this.getAll();
    return routes.find((r) => r.id === id) || null;
  }

  async save(routeInput: FavoriteRoute): Promise<{ success: boolean; route?: FavoriteRoute; error?: string }> {
    // 1. Validation
    if (!routeInput.name || routeInput.name.trim().length === 0) {
      return { success: false, error: 'Favorite route name cannot be empty' };
    }
    if (
      !routeInput.origin ||
      typeof routeInput.origin.latitude !== 'number' ||
      routeInput.origin.latitude < -90 ||
      routeInput.origin.latitude > 90 ||
      typeof routeInput.origin.longitude !== 'number' ||
      routeInput.origin.longitude < -180 ||
      routeInput.origin.longitude > 180
    ) {
      return { success: false, error: 'Invalid origin location coordinates' };
    }
    if (
      !routeInput.destination ||
      typeof routeInput.destination.latitude !== 'number' ||
      routeInput.destination.latitude < -90 ||
      routeInput.destination.latitude > 90 ||
      typeof routeInput.destination.longitude !== 'number' ||
      routeInput.destination.longitude < -180 ||
      routeInput.destination.longitude > 180
    ) {
      return { success: false, error: 'Invalid destination location coordinates' };
    }

    const routes = await this.getAll();

    // 2. Limit Check
    if (routes.length >= MAX_FAVORITE_ROUTES_LIMIT && !routes.some((r) => r.id === routeInput.id)) {
      return {
        success: false,
        error: `Maximum limit of ${MAX_FAVORITE_ROUTES_LIMIT} favorite routes reached.`,
      };
    }

    // 3. Deduplication Check (Origin & Destination within 30m)
    const existingDuplicate = routes.find((r) => {
      const origDist = calculateDistanceMeters(
        { latitude: r.origin.latitude, longitude: r.origin.longitude },
        { latitude: routeInput.origin.latitude, longitude: routeInput.origin.longitude }
      );
      const destDist = calculateDistanceMeters(
        { latitude: r.destination.latitude, longitude: r.destination.longitude },
        { latitude: routeInput.destination.latitude, longitude: routeInput.destination.longitude }
      );
      return origDist <= 30 && destDist <= 30;
    });

    if (existingDuplicate && existingDuplicate.id !== routeInput.id) {
      return { success: true, route: existingDuplicate };
    }

    // 4. Construct & Store Route Object
    const now = Date.now();
    const newRoute: FavoriteRoute = {
      id: routeInput.id || `fr_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: routeInput.name.trim(),
      origin: {
        id: routeInput.origin.id || 'origin',
        name: routeInput.origin.name || 'Origin',
        latitude: routeInput.origin.latitude,
        longitude: routeInput.origin.longitude,
        subtitle: routeInput.origin.subtitle,
      },
      destination: {
        id: routeInput.destination.id || 'destination',
        name: routeInput.destination.name || 'Destination',
        latitude: routeInput.destination.latitude,
        longitude: routeInput.destination.longitude,
        subtitle: routeInput.destination.subtitle,
      },
      journeyId: routeInput.journeyId,
      modeSummary: routeInput.modeSummary || [],
      routeSummary: routeInput.routeSummary || `${routeInput.origin.name} ➔ ${routeInput.destination.name}`,
      estimatedDurationMinutes: routeInput.estimatedDurationMinutes,
      estimatedFare: routeInput.estimatedFare,
      lastUsedAt: routeInput.lastUsedAt || now,
      createdAt: routeInput.createdAt || now,
      updatedAt: now,
    };

    const updatedList = routes.filter((r) => r.id !== newRoute.id);
    updatedList.push(newRoute);

    await localStorageService.setItem(STORAGE_KEY, updatedList);
    return { success: true, route: newRoute };
  }

  async update(route: FavoriteRoute): Promise<{ success: boolean; error?: string }> {
    const res = await this.save(route);
    return { success: res.success, error: res.error };
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const routes = await this.getAll();
    const filtered = routes.filter((r) => r.id !== id);
    await localStorageService.setItem(STORAGE_KEY, filtered);
    return { success: true };
  }

  async updateLastUsed(id: string): Promise<void> {
    const routes = await this.getAll();
    const target = routes.find((r) => r.id === id);
    if (target) {
      target.lastUsedAt = Date.now();
      target.updatedAt = Date.now();
      await localStorageService.setItem(STORAGE_KEY, routes);
    }
  }

  private sortRoutes(routes: FavoriteRoute[]): FavoriteRoute[] {
    return [...routes].sort((a, b) => {
      const timeA = a.lastUsedAt || a.updatedAt || 0;
      const timeB = b.lastUsedAt || b.updatedAt || 0;
      return timeB - timeA;
    });
  }
}

export const localFavoriteRoutesRepository = new LocalFavoriteRoutesRepository();
