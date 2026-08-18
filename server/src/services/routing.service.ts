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

    // 1. Concurrently fetch nearby candidate stops for origin and destination, transfer pairs, and transit edges
    const [originStops, destStops, transferPairs, networkData] = await Promise.all([
      routingRepository.findNearbyStops(
        origin.latitude,
        origin.longitude,
        maxWalkingDistanceMeters
      ),
      routingRepository.findNearbyStops(
        destination.latitude,
        destination.longitude,
        maxWalkingDistanceMeters
      ),
      routingRepository.findTransferPairs(450), // Transfer walks up to 450m
      routingRepository.getTransitNetworkEdges(),
    ]);

    logger.info(
      `[ROUTING] Graph nodes: originCandidates=${originStops.length}, destCandidates=${destStops.length}, networkEdges=${networkData.edges.length}, transferPairs=${transferPairs.length}`
    );

    // 2. Execute bounded pathfinding
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

    const durationMs = Date.now() - startTime;
    logger.info(
      `[ROUTING] Found ${journeys.length} routes in ${durationMs}ms: [${journeys.map((j) => `${j.label || 'OPTION'}: ₱${j.fare}, ${j.durationMinutes}m, ${j.transfers}x`).join(' | ')}]`
    );

    return journeys;
  }
}

export const routingService = new RoutingService();
