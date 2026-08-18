import { routingRepository } from '../repositories/routing.repository.js';
import { findMultimodalRoutes } from '../routing/pathfinder.js';
import { Journey } from '../routing/graph.types.js';
import { logger } from '../utils/logger.js';

export interface RouteSearchPayload {
  origin: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  maxWalkingDistanceMeters?: number;
  maxTransfers?: number;
  limit?: number;
}

export class RoutingService {
  /**
   * Calculates multimodal routes from origin to destination using PostgreSQL + PostGIS transit graph.
   */
  async planJourney(payload: RouteSearchPayload): Promise<Journey[]> {
    const startTime = Date.now();
    const {
      origin,
      destination,
      maxWalkingDistanceMeters = 1000,
      maxTransfers = 3,
      limit = 5,
    } = payload;

    logger.info(
      `[ROUTING] Planning journey: origin=(${origin.latitude}, ${origin.longitude}) -> dest=(${destination.latitude}, ${destination.longitude}), maxWalk=${maxWalkingDistanceMeters}m, maxTransfers=${maxTransfers}`
    );

    // 1. Query GTFS Direct & Transfer Routes from PostgreSQL PostGIS
    const gtfsRows = await routingRepository.findGTFSJourneys(origin, destination, 3500);

    logger.info(`[ROUTING] Live GTFS database query found ${gtfsRows.length} routes.`);

    if (gtfsRows && gtfsRows.length > 0) {
      const journeys: Journey[] = gtfsRows.map((row, idx) => {
        const mode = (row.mode_code as any) || 'bus';
        const dist = Number(row.distance_meters) || 2400;
        const durationMin = Math.max(8, Math.round(dist / 220) + 8);
        const fareVal = Number(row.fare) || 13;

        const fromLat = Number(row.from_lat) || origin.latitude;
        const fromLng = Number(row.from_lng) || origin.longitude;
        const toLat = Number(row.to_lat) || destination.latitude;
        const toLng = Number(row.to_lng) || destination.longitude;

        return {
          id: `gtfs-${row.route_id}-${idx}`,
          label: idx === 0 ? 'FASTEST' : idx === 1 ? 'CHEAPEST' : idx === 2 ? 'LESS WALKING' : 'FEWER TRANSFERS',
          isRecommended: idx === 0,
          durationMinutes: durationMin,
          fare: fareVal,
          currency: 'PHP',
          walkingDistanceMeters: 250,
          transfers: 0,
          modes: [mode, 'walking'],
          routeCodes: [row.route_code || mode.toUpperCase()],
          summary: row.route_name || `${row.route_code} Direct`,
          origin: {
            latitude: origin.latitude,
            longitude: origin.longitude,
            name: origin.name || 'Origin',
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
            name: destination.name || 'Destination',
          },
          segments: [
            {
              type: 'walking',
              mode: 'walking',
              fromStop: {
                id: 'origin',
                name: origin.name || 'Origin',
                latitude: origin.latitude,
                longitude: origin.longitude,
              },
              toStop: {
                id: row.from_stop_id,
                name: row.from_stop_name || 'Boarding Stop',
                code: row.from_stop_code || undefined,
                latitude: fromLat,
                longitude: fromLng,
              },
              durationMinutes: 4,
              distanceMeters: 250,
              fare: 0,
              instructions: `Walk 250m to ${row.from_stop_name || 'transit stop'}`,
              geometry: {
                type: 'LineString',
                coordinates: [
                  [origin.longitude, origin.latitude],
                  [fromLng, fromLat],
                ],
              },
            },
            {
              type: 'transit',
              mode: mode,
              routeId: row.route_id,
              routeName: row.route_name,
              routeCode: row.route_code,
              modeColor: row.mode_color || '#0F766E',
              fromStop: {
                id: row.from_stop_id,
                name: row.from_stop_name || 'Boarding Stop',
                code: row.from_stop_code || undefined,
                latitude: fromLat,
                longitude: fromLng,
              },
              toStop: {
                id: row.to_stop_id,
                name: row.to_stop_name || 'Alighting Stop',
                code: row.to_stop_code || undefined,
                latitude: toLat,
                longitude: toLng,
              },
              durationMinutes: durationMin - 4,
              distanceMeters: dist,
              fare: fareVal,
              stopsCount: Number(row.stops_count) || 4,
              instructions: `Board ${row.route_code}: ${row.route_name} at ${row.from_stop_name} and alight at ${row.to_stop_name}`,
              geometry: {
                type: 'LineString',
                coordinates: [
                  [fromLng, fromLat],
                  [toLng, toLat],
                ],
              },
            },
          ],
        };
      });

      const durationMs = Date.now() - startTime;
      logger.info(`[ROUTING] Returned ${journeys.length} GTFS PostGIS routes in ${durationMs}ms`);
      return journeys;
    }

    // 2. Fallback to graph pathfinding if no direct ST_DWithin stops match
    const [originStops, destStops, transferPairs, networkData] = await Promise.all([
      routingRepository.findNearbyStops(origin.latitude, origin.longitude, maxWalkingDistanceMeters),
      routingRepository.findNearbyStops(destination.latitude, destination.longitude, maxWalkingDistanceMeters),
      routingRepository.findTransferPairs(450),
      routingRepository.getTransitNetworkEdges(),
    ]);

    const journeys = findMultimodalRoutes({
      origin,
      destination,
      originStops,
      destinationStops: destStops,
      transitEdges: networkData.edges,
      transferPairs,
      allStopsMap: networkData.stops,
      maxWalkingDistanceMeters,
      maxTransfers,
      limit,
    });

    return journeys;
  }
}

export const routingService = new RoutingService();
