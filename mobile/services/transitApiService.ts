/**
 * Real Transit Backend API Service
 * Connects the BiyaEase mobile client to the Express + PostGIS backend.
 * Retains decoupled fallback to mock data when backend is unreachable.
 */

const API_BASE_URL = 'http://localhost:5000/api';

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
  latitude: number;
  longitude: number;
  distance_meters?: number;
}

export interface ApiPlace {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_meters?: number;
}

export const transitApiService = {
  async getModes(): Promise<ApiTransitMode[]> {
    const res = await fetch(`${API_BASE_URL}/transit/modes`);
    const json = await res.json();
    return json.data || [];
  },

  async getRoutes(): Promise<ApiTransitRoute[]> {
    const res = await fetch(`${API_BASE_URL}/transit/routes`);
    const json = await res.json();
    return json.data || [];
  },

  async getNearbyStops(
    lat: number,
    lng: number,
    radiusMeters: number = 1000
  ): Promise<ApiTransitStop[]> {
    const res = await fetch(
      `${API_BASE_URL}/transit/stops/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`
    );
    const json = await res.json();
    return json.data || [];
  },

  async searchPlaces(query: string): Promise<ApiPlace[]> {
    const res = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    return json.data || [];
  },

  async getNearbyPlaces(
    lat: number,
    lng: number,
    radiusMeters: number = 2000
  ): Promise<ApiPlace[]> {
    const res = await fetch(
      `${API_BASE_URL}/places/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`
    );
    const json = await res.json();
    return json.data || [];
  },
};
