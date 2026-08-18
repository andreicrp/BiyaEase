import {
  Destination,
  RouteOption,
  RouteFilterCategory,
  NearbyTransport,
  SavedPlace,
  SavedRoute,
  RecentTrip,
} from '../types/index';
import {
  mockPopularDestinations,
  mockRecentSearches,
  mockRouteOptions,
  mockNearbyTransport,
  mockSavedPlaces,
  mockSavedRoutes,
  mockRecentTrips,
} from '../data/mockData';

export class MockTransitService {
  /**
   * Search and filter destinations based on a query keyword
   */
  public static async searchDestinations(queryText: string): Promise<Destination[]> {
    const trimmed = queryText.trim().toLowerCase();
    if (!trimmed) {
      return mockPopularDestinations;
    }

    return mockPopularDestinations.filter((item) => {
      const matchName = item.name.toLowerCase().includes(trimmed);
      const matchArea = item.area.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(trimmed) ?? false;
      return matchName || matchArea || matchCategory || matchSubtitle;
    });
  }

  /**
   * Get recent search history
   */
  public static async getRecentSearches(): Promise<Destination[]> {
    return mockRecentSearches;
  }

  /**
   * Get popular destinations in Metro Manila
   */
  public static async getPopularDestinations(): Promise<Destination[]> {
    return mockPopularDestinations;
  }

  /**
   * Calculate/retrieve route options between origin and destination
   */
  public static async getRouteOptions(
    origin: string,
    destination: string,
    filter: RouteFilterCategory = 'all'
  ): Promise<RouteOption[]> {
    // Generate clone with updated origin/destination names
    const routes = mockRouteOptions.map((r) => ({
      ...r,
      origin: origin || r.origin,
      destination: destination || r.destination,
    }));

    switch (filter) {
      case 'fastest':
        return [...routes].sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
      case 'cheapest':
        return [...routes].sort((a, b) => a.totalFare - b.totalFare);
      case 'less_walking':
        return [...routes].sort((a, b) => a.walkingDistanceMeters - b.walkingDistanceMeters);
      case 'fewer_transfers':
        return [...routes].sort((a, b) => a.transfersCount - b.transfersCount);
      case 'all':
      default:
        return routes;
    }
  }

  /**
   * Get route details by ID
   */
  public static async getRouteById(id: string): Promise<RouteOption | null> {
    const found = mockRouteOptions.find((r) => r.id === id);
    return found ? { ...found } : (mockRouteOptions[0] ?? null);
  }

  /**
   * Get mock nearby transportation
   */
  public static async getNearbyTransport(): Promise<NearbyTransport[]> {
    return mockNearbyTransport;
  }

  /**
   * Get saved places
   */
  public static async getSavedPlaces(): Promise<SavedPlace[]> {
    return mockSavedPlaces;
  }

  /**
   * Get saved routes
   */
  public static async getSavedRoutes(): Promise<SavedRoute[]> {
    return mockSavedRoutes;
  }

  /**
   * Get recent trips
   */
  public static async getRecentTrips(): Promise<RecentTrip[]> {
    return mockRecentTrips;
  }
}
