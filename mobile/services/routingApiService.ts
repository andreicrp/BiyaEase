import { Journey, RoutingSearchRequest } from '../types/routing.types';
import { mockRouteOptions } from '../data/mockData';

const API_BASE_URL = 'http://localhost:5000/api';

export const routingApiService = {
  /**
   * Calculate feasible multimodal transit journeys using backend /api/routes/search.
   * Includes 5000ms timeout and resilient fallback to sample routes.
   */
  async searchRoutes(request: RoutingSearchRequest): Promise<Journey[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/routes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data?.routes)) {
        return json.data.routes;
      }
    } catch {
      // Fallback below
    }

    // Fallback: convert mockRouteOptions to Journey model
    return mockRouteOptions.map((opt, idx) => ({
      id: `fallback-${opt.id}`,
      label: idx === 0 ? 'FASTEST' : idx === 1 ? 'CHEAPEST' : 'LESS WALKING',
      isRecommended: idx === 0,
      durationMinutes: opt.totalDurationMinutes,
      fare: opt.totalFare,
      currency: 'PHP',
      walkingDistanceMeters: opt.walkingDistanceMeters,
      transfers: opt.transfersCount,
      modes: opt.modes,
      summary: opt.summary,
      origin: {
        latitude: request.origin.latitude,
        longitude: request.origin.longitude,
        name: request.origin.name || opt.origin,
      },
      destination: {
        latitude: request.destination.latitude,
        longitude: request.destination.longitude,
        name: request.destination.name || opt.destination,
      },
      segments: opt.steps.map((s) => ({
        type: (s.mode === 'walking' ? 'walking' : 'transit') as 'walking' | 'transit',
        mode: s.mode,
        routeId: s.id,
        routeName: s.title,
        routeCode: s.mode.toUpperCase(),
        fromStop: {
          id: `from-${s.id}`,
          name: s.originStop,
          latitude: s.coordinates?.latitude || 14.6538,
          longitude: s.coordinates?.longitude || 121.0685,
        },
        toStop: {
          id: `to-${s.id}`,
          name: s.destinationStop,
          latitude: s.coordinates?.latitude || 14.6515,
          longitude: s.coordinates?.longitude || 121.0335,
        },
        durationMinutes: s.durationMinutes,
        distanceMeters: s.distanceMeters,
        fare: s.fare || 0,
        instructions: s.instructions || s.title,
      })),
    }));
  },
};
