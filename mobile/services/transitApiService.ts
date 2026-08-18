/**
 * Real Transit Backend API Service
 * Connects the BiyaEase mobile client to the Express + PostGIS backend.
 * Retains decoupled fallback to mock data when backend is unreachable.
 */

import { Coordinates, geoJsonLineStringToCoordinates } from '../utils/geoUtils';
import { mockNearbyTransport, mockSavedPlaces } from '../data/mockData';
import { TransitMode } from '../types/index';

const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname
    ? `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:5000/api`
    : 'http://127.0.0.1:5000/api';

export interface ApiTransitMode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface ApiTransitRoute {
  id: string;
  code: string;
  name: string;
  mode_code: string;
  mode_name: string;
  mode_color: string | null;
  route_color: string | null;
  description: string | null;
}

export interface ApiTransitStop {
  id: string;
  code: string | null;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  mode?: TransitMode;
  mode_color?: string;
  routes_count?: number;
}

export interface ApiPlace {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  nearby_transit_count?: number;
}

export interface ApiRouteVariantStops {
  routeId: string;
  variantId: string;
  stops: {
    stop_id: string;
    stop_sequence: number;
    stop_name: string;
    latitude: number;
    longitude: number;
    arrival_time?: string;
    departure_time?: string;
  }[];
}

export interface ApiRouteShape {
  id: string;
  route_variant_id: string;
  coordinates: Coordinates[];
}

export const transitApiService = {
  async getModes(): Promise<ApiTransitMode[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/transit/modes`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [
        {
          id: 'mode-jeepney',
          code: 'jeepney',
          name: 'Jeepney',
          description: 'Traditional & Modern PUJ',
          icon: '🚐',
          color: '#F59E0B',
        },
        {
          id: 'mode-bus',
          code: 'bus',
          name: 'Bus',
          description: 'City Bus & EDSA Carousel',
          icon: '🚌',
          color: '#2563EB',
        },
        {
          id: 'mode-mrt',
          code: 'mrt',
          name: 'MRT Rail',
          description: 'Metro Rail Transit',
          icon: '🚆',
          color: '#7C3AED',
        },
        {
          id: 'mode-lrt',
          code: 'lrt',
          name: 'LRT Rail',
          description: 'Light Rail Transit',
          icon: '🚈',
          color: '#DB2777',
        },
        {
          id: 'mode-uv',
          code: 'uvexpress',
          name: 'UV Express',
          description: 'Point-to-Point Shuttle Van',
          icon: '🚐',
          color: '#0F766E',
        },
        {
          id: 'mode-trike',
          code: 'tricycle',
          name: 'Tricycle',
          description: 'First/Last Mile Feeder',
          icon: '🛺',
          color: '#10B981',
        },
      ];
    }
  },

  async getRoutes(): Promise<ApiTransitRoute[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/transit/routes`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getRoute(id: string): Promise<ApiTransitRoute | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/transit/routes/${id}`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async getRouteStops(routeId: string, variantId?: string): Promise<ApiRouteVariantStops | null> {
    try {
      const url = variantId
        ? `${API_BASE_URL}/transit/routes/${routeId}/stops?variantId=${variantId}`
        : `${API_BASE_URL}/transit/routes/${routeId}/stops`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async getRouteShape(routeId: string, variantId?: string): Promise<ApiRouteShape | null> {
    try {
      const url = variantId
        ? `${API_BASE_URL}/transit/routes/${routeId}/shape?variantId=${variantId}`
        : `${API_BASE_URL}/transit/routes/${routeId}/shape`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const json = await res.json();
      if (!json.data || !json.data.geometry || !json.data.geometry.coordinates) {
        return null;
      }
      return {
        id: json.data.id,
        route_variant_id: json.data.route_variant_id,
        coordinates: geoJsonLineStringToCoordinates(json.data.geometry.coordinates),
      };
    } catch {
      return null;
    }
  },

  async getNearbyStops(
    lat: number,
    lng: number,
    radiusMeters: number = 1500
  ): Promise<ApiTransitStop[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/transit/stops/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`,
        { signal: AbortSignal.timeout(3000) }
      );
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    } catch {
      // Fallback below
    }

    // Decoupled fallback using mock data with real-world Metro Manila coordinates
    return mockNearbyTransport.map((m, idx) => ({
      id: m.id,
      code: `STOP-${idx + 1}`,
      name: m.stopName,
      latitude: m.coordinates?.latitude ?? 14.6538,
      longitude: m.coordinates?.longitude ?? 121.0685,
      distance_meters: m.distanceMeters,
      mode: m.mode,
      routes_count: 1,
    }));
  },

  async getPlaces(): Promise<ApiPlace[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/places`, { signal: AbortSignal.timeout(3000) });
      const json = await res.json();
      return json.data || [];
    } catch {
      return mockSavedPlaces.map((p, idx) => ({
        id: p.id,
        name: p.name,
        category: p.type,
        address: p.address,
        latitude: p.coordinates?.latitude || 14.6538 + idx * 0.004,
        longitude: p.coordinates?.longitude || 121.0685 + idx * 0.004,
      }));
    }
  },

  async searchPlaces(query: string): Promise<ApiPlace[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(3000),
      });
      const json = await res.json();
      return json.data || [];
    } catch {
      const q = query.toLowerCase();
      return mockSavedPlaces
        .filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
        .map((p, idx) => ({
          id: p.id,
          name: p.name,
          category: p.type,
          address: p.address,
          latitude: p.coordinates?.latitude || 14.6538 + idx * 0.004,
          longitude: p.coordinates?.longitude || 121.0685 + idx * 0.004,
        }));
    }
  },

  async getNearbyPlaces(
    lat: number,
    lng: number,
    radiusMeters: number = 2000
  ): Promise<ApiPlace[]> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/places/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`,
        { signal: AbortSignal.timeout(3000) }
      );
      const json = await res.json();
      return json.data || [];
    } catch {
      return mockSavedPlaces.map((p, idx) => ({
        id: p.id,
        name: p.name,
        category: p.type,
        address: p.address,
        latitude: p.coordinates?.latitude || 14.6538 + idx * 0.004,
        longitude: p.coordinates?.longitude || 121.0685 + idx * 0.004,
      }));
    }
  },
};
