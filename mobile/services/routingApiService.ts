import { Journey, RoutingSearchRequest } from '../types/routing.types';

const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.hostname
    ? `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:5000/api`
    : 'http://127.0.0.1:5000/api';

export const routingApiService = {
  /**
   * Calculate real GTFS multimodal transit journeys using backend /api/routes/search.
   * Directly queries PostgreSQL + PostGIS database containing 4,881 GTFS stops and 1,725 GTFS routes.
   */
  async searchRoutes(request: RoutingSearchRequest): Promise<Journey[]> {
    const res = await fetch(`${API_BASE_URL}/routes/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Routing API server error HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data?.routes)) {
      return json.data.routes;
    }

    return [];
  },
};
