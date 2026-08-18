import {
  Journey,
  TransitStopNode,
  TransitEdge,
  WalkingEdge,
  RoutingSearchState,
} from './graph.types.js';
import { calculateWalkingDurationSeconds } from './timeCalculator.js';
import { buildJourneyFromPath, buildWalkingOnlyJourney, RawJourneyPath } from './journeyBuilder.js';
import { deduplicateJourneys } from './journeyDeduplicator.js';
import { rankAndLabelJourneys } from './routeRanker.js';

export interface PathfinderOptions {
  origin: { latitude: number; longitude: number; name?: string };
  destination: { latitude: number; longitude: number; name?: string };
  originStops: { stop: TransitStopNode; distanceMeters: number }[];
  destinationStops: { stop: TransitStopNode; distanceMeters: number }[];
  transitEdges: TransitEdge[];
  transferPairs: { fromStopId: string; toStopId: string; distanceMeters: number }[];
  allStopsMap: Map<string, TransitStopNode>;
  maxWalkingDistanceMeters?: number;
  maxTransfers?: number;
  limit?: number;
}

/**
 * Calculates straight-line distance in meters between two lat/lng points using Haversine.
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function findMultimodalRoutes(options: PathfinderOptions): Journey[] {
  const {
    origin,
    destination,
    originStops,
    destinationStops,
    transitEdges,
    transferPairs,
    allStopsMap,
    maxWalkingDistanceMeters = 1000,
    maxTransfers = 3,
    limit = 5,
  } = options;

  const candidateJourneys: Journey[] = [];
  let journeyCounter = 1;

  // 1. Direct Walking-Only Route (if origin to destination is walkable)
  const directDistance = calculateHaversineDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  if (directDistance <= maxWalkingDistanceMeters) {
    candidateJourneys.push(
      buildWalkingOnlyJourney(
        `journey-walk-${journeyCounter++}`,
        origin,
        destination,
        directDistance
      )
    );
  }

  // If no transit stops nearby, return walking route or empty
  if (originStops.length === 0 || destinationStops.length === 0) {
    return rankAndLabelJourneys(candidateJourneys, limit);
  }

  // 2. Build Adjacency Graph Map for Fast Lookup
  const transitAdj = new Map<string, TransitEdge[]>();
  for (const e of transitEdges) {
    if (!transitAdj.has(e.fromStopId)) {
      transitAdj.set(e.fromStopId, []);
    }
    transitAdj.get(e.fromStopId)!.push(e);
  }

  const transferAdj = new Map<string, WalkingEdge[]>();
  for (const t of transferPairs) {
    if (!transferAdj.has(t.fromStopId)) {
      transferAdj.set(t.fromStopId, []);
    }
    transferAdj.get(t.fromStopId)!.push({
      fromStopId: t.fromStopId,
      toStopId: t.toStopId,
      distanceMeters: t.distanceMeters,
      durationSeconds: calculateWalkingDurationSeconds(t.distanceMeters),
    });
  }

  // Map of destination candidate stops for O(1) checking
  const destStopMap = new Map<string, number>();
  for (const d of destinationStops) {
    destStopMap.set(d.stop.id, d.distanceMeters);
  }

  // 3. Multi-Criteria Bounded Search from Candidate Origin Stops
  const MAX_EXPLORED_STATES = 5000;
  let exploredStates = 0;

  for (const oCandidate of originStops) {
    const originStopId = oCandidate.stop.id;
    const originWalkDist = oCandidate.distanceMeters;
    const originWalkSec = calculateWalkingDurationSeconds(originWalkDist);

    // Initial search state starting at originStop
    const queue: RoutingSearchState[] = [
      {
        currentStopId: originStopId,
        elapsedSeconds: originWalkSec,
        totalFare: 0,
        walkingDistanceMeters: originWalkDist,
        transferCount: 0,
        path: [],
        visitedStops: new Set([originStopId]),
      },
    ];

    while (queue.length > 0 && exploredStates < MAX_EXPLORED_STATES) {
      // Pop state with lowest elapsed seconds
      queue.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
      const state = queue.shift()!;
      exploredStates++;

      // Check if current stop is one of the destination candidate stops
      if (destStopMap.has(state.currentStopId) && state.path.length > 0) {
        const destWalkDist = destStopMap.get(state.currentStopId)!;
        const destWalkSec = calculateWalkingDurationSeconds(destWalkDist);

        const pathData: RawJourneyPath = {
          originWalkDistance: originWalkDist,
          originWalkSeconds: originWalkSec,
          firstStopId: originStopId,
          edges: state.path,
          lastStopId: state.currentStopId,
          destWalkDistance: destWalkDist,
          destWalkSeconds: destWalkSec,
        };

        const journey = buildJourneyFromPath(
          `journey-transit-${journeyCounter++}`,
          origin,
          destination,
          pathData,
          allStopsMap
        );

        candidateJourneys.push(journey);

        // Found a good path for this branch, continue exploring others
        if (candidateJourneys.length >= 20) break;
      }

      // If maximum transfers exceeded, do not expand further
      if (state.transferCount > maxTransfers) continue;

      // Expand 1: Consecutive Transit Edges
      const outTransit = transitAdj.get(state.currentStopId) || [];
      for (const tEdge of outTransit) {
        if (state.visitedStops.has(tEdge.toStopId)) continue;

        const isNewRoute = state.currentRouteId && state.currentRouteId !== tEdge.routeId;
        const newTransfers = isNewRoute ? state.transferCount + 1 : state.transferCount;

        if (newTransfers > maxTransfers) continue;

        const newVisited = new Set(state.visitedStops);
        newVisited.add(tEdge.toStopId);

        queue.push({
          currentStopId: tEdge.toStopId,
          elapsedSeconds: state.elapsedSeconds + tEdge.durationSeconds,
          totalFare: state.totalFare + tEdge.fare,
          walkingDistanceMeters: state.walkingDistanceMeters,
          transferCount: newTransfers,
          currentRouteId: tEdge.routeId,
          currentMode: tEdge.mode,
          path: [...state.path, tEdge],
          visitedStops: newVisited,
        });
      }

      // Expand 2: Inter-stop Walking Transfer Edges (only if currently on a transit line)
      if (state.path.length > 0) {
        const outTransfers = transferAdj.get(state.currentStopId) || [];
        for (const wEdge of outTransfers) {
          if (state.visitedStops.has(wEdge.toStopId)) continue;
          if (state.transferCount + 1 > maxTransfers) continue;

          const newVisited = new Set(state.visitedStops);
          newVisited.add(wEdge.toStopId);

          queue.push({
            currentStopId: wEdge.toStopId,
            elapsedSeconds: state.elapsedSeconds + wEdge.durationSeconds,
            totalFare: state.totalFare,
            walkingDistanceMeters: state.walkingDistanceMeters + wEdge.distanceMeters,
            transferCount: state.transferCount + 1,
            currentRouteId: undefined,
            currentMode: undefined,
            path: [...state.path, wEdge],
            visitedStops: newVisited,
          });
        }
      }
    }
  }

  // 4. Deduplicate and Rank Final Journey Set
  const uniqueJourneys = deduplicateJourneys(candidateJourneys);
  return rankAndLabelJourneys(uniqueJourneys, limit);
}
