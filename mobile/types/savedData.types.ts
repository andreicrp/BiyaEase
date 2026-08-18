import { SearchResultType } from './search.types';

export type SavedPlaceCategory =
  | 'home'
  | 'work'
  | 'school'
  | 'favorite'
  | 'other';

export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  type?: SearchResultType;
  category: SavedPlaceCategory;
  createdAt: number;
  updatedAt: number;
}

export interface SavedLocationReference {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
}

export interface FavoriteRoute {
  id: string;
  name: string;
  origin: SavedLocationReference;
  destination: SavedLocationReference;
  journeyId?: string;
  modeSummary?: string[];
  routeSummary?: string;
  estimatedDurationMinutes?: number;
  estimatedFare?: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedPlacesRepository {
  getAll(): Promise<SavedPlace[]>;
  getById(id: string): Promise<SavedPlace | null>;
  save(place: SavedPlace, options?: { forceReplaceCategory?: boolean }): Promise<{ success: boolean; place?: SavedPlace; requiresReplace?: 'home' | 'work'; error?: string }>;
  update(place: SavedPlace): Promise<{ success: boolean; error?: string }>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
}

export interface FavoriteRoutesRepository {
  getAll(): Promise<FavoriteRoute[]>;
  getById(id: string): Promise<FavoriteRoute | null>;
  save(route: FavoriteRoute): Promise<{ success: boolean; route?: FavoriteRoute; error?: string }>;
  update(route: FavoriteRoute): Promise<{ success: boolean; error?: string }>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  updateLastUsed?: (id: string) => Promise<void>;
}
