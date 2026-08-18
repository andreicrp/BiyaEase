import { SearchResult, SelectedLocation, RecentSearchItem } from '../types/search.types';
import { mockNearbyTransport, mockSavedPlaces } from '../data/mockData';

const API_BASE_URL = 'http://localhost:5000/api';

export interface SearchOptions {
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}

// In-memory recent search storage (can easily sync with AsyncStorage in production)
let memoryRecentSearches: RecentSearchItem[] = [
  {
    id: 'recent-1',
    query: 'SM North',
    name: 'SM North EDSA',
    type: 'place',
    latitude: 14.6565,
    longitude: 121.0288,
    subtitle: 'Mall · Quezon City',
    timestamp: 'Today',
  },
  {
    id: 'recent-2',
    query: 'UP Diliman',
    name: 'University of the Philippines Diliman',
    type: 'place',
    latitude: 14.6538,
    longitude: 121.0685,
    subtitle: 'University · Quezon City',
    timestamp: 'Yesterday',
  },
  {
    id: 'recent-3',
    query: 'MRT',
    name: 'Quezon Avenue MRT-3 Station',
    type: 'station',
    latitude: 14.6429,
    longitude: 121.0384,
    subtitle: 'MRT Station · EDSA',
    timestamp: '3 days ago',
  },
];

export const searchApiService = {
  /**
   * Query the real backend search API (/api/search?q=...)
   * Includes 3000ms timeout and resilient fallback to local data.
   */
  async searchLocations(queryText: string, options?: SearchOptions): Promise<SearchResult[]> {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const params = new URLSearchParams({ q: trimmed });
      if (options?.lat !== undefined && options?.lng !== undefined) {
        params.append('lat', options.lat.toString());
        params.append('lng', options.lng.toString());
      }
      if (options?.radius !== undefined) {
        params.append('radius', options.radius.toString());
      }
      if (options?.limit !== undefined) {
        params.append('limit', options.limit.toString());
      }

      const res = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch {
      // Fallback below
    }

    // Resilient local fallback search
    const q = trimmed.toLowerCase();
    const results: SearchResult[] = [];

    // Search local places
    mockSavedPlaces
      .filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
      .forEach((p) => {
        results.push({
          id: `place:${p.id}`,
          type: 'place',
          name: p.name,
          subtitle: `${p.type.toUpperCase()} · ${p.address}`,
          latitude: p.coordinates?.latitude || 14.6538,
          longitude: p.coordinates?.longitude || 121.0685,
          category: p.type,
        });
      });

    // Search local transit stops & routes
    mockNearbyTransport
      .filter(
        (t) =>
          t.stopName.toLowerCase().includes(q) ||
          t.routeName.toLowerCase().includes(q) ||
          t.mode.toLowerCase().includes(q)
      )
      .forEach((t) => {
        results.push({
          id: `stop:${t.id}`,
          type: t.mode === 'mrt' || t.mode === 'lrt' ? 'station' : 'stop',
          name: t.stopName,
          subtitle: `${t.mode.toUpperCase()} · ${t.heading}`,
          latitude: t.coordinates?.latitude || 14.6425,
          longitude: t.coordinates?.longitude || 121.0384,
          mode: t.mode,
          distanceMeters: t.distanceMeters,
        });
      });

    return results.slice(0, options?.limit || 20);
  },

  async getRecentSearches(): Promise<RecentSearchItem[]> {
    return memoryRecentSearches;
  },

  async saveRecentSearch(item: SelectedLocation): Promise<void> {
    const existingIdx = memoryRecentSearches.findIndex((r) => r.id === item.id);
    if (existingIdx >= 0) {
      memoryRecentSearches.splice(existingIdx, 1);
    }

    const newItem: RecentSearchItem = {
      id: item.id,
      query: item.name,
      name: item.name,
      type: item.type,
      latitude: item.latitude,
      longitude: item.longitude,
      subtitle: item.subtitle,
      timestamp: 'Just now',
    };

    memoryRecentSearches.unshift(newItem);
    if (memoryRecentSearches.length > 10) {
      memoryRecentSearches = memoryRecentSearches.slice(0, 10);
    }
  },

  async clearRecentSearches(): Promise<void> {
    memoryRecentSearches = [];
  },
};
