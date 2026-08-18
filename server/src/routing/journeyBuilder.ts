import {
  Journey,
  JourneySegment,
  JourneyMode,
  TransitStopNode,
  TransitEdge,
  WalkingEdge,
} from './graph.types.js';
import { calculateWalkingDurationSeconds, secondsToMinutes } from './timeCalculator.js';

export interface RawJourneyPath {
  originWalkDistance: number;
  originWalkSeconds: number;
  firstStopId: string;
  edges: (TransitEdge | WalkingEdge)[];
  lastStopId: string;
  destWalkDistance: number;
  destWalkSeconds: number;
}

export function buildJourneyFromPath(
  journeyId: string,
  origin: { latitude: number; longitude: number; name?: string },
  destination: { latitude: number; longitude: number; name?: string },
  pathData: RawJourneyPath,
  stopsMap: Map<string, TransitStopNode>
): Journey {
  const segments: JourneySegment[] = [];
  const modes: JourneyMode[] = [];
  let totalDurationSeconds = 0;
  let totalFare = 0;
  let totalWalkingMeters = 0;
  let transitTransferCount = 0;

  // 1. Initial Walking Segment from Origin -> First Transit Stop
  if (pathData.originWalkDistance > 0) {
    const firstStop = stopsMap.get(pathData.firstStopId);
    const durationMin = secondsToMinutes(pathData.originWalkSeconds);

    segments.push({
      type: 'walking',
      mode: 'walking',
      fromStop: {
        id: 'origin',
        name: origin.name || 'Origin Location',
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      toStop: firstStop
        ? {
            id: firstStop.id,
            name: firstStop.name,
            code: firstStop.code || undefined,
            latitude: firstStop.latitude,
            longitude: firstStop.longitude,
          }
        : undefined,
      durationMinutes: durationMin,
      distanceMeters: Math.round(pathData.originWalkDistance),
      fare: 0,
      instructions: `Walk ${Math.round(pathData.originWalkDistance)}m to ${firstStop?.name || 'transit stop'}`,
      geometry: firstStop
        ? {
            type: 'LineString',
            coordinates: [
              [origin.longitude, origin.latitude],
              [firstStop.longitude, firstStop.latitude],
            ],
          }
        : undefined,
    });

    modes.push('walking');
    totalDurationSeconds += pathData.originWalkSeconds;
    totalWalkingMeters += pathData.originWalkDistance;
  }

  // 2. Process and Consolidate Transit & Transfer Edges
  let currentTransitGroup: TransitEdge[] = [];

  const flushTransitGroup = () => {
    if (currentTransitGroup.length === 0) return;

    const firstEdge = currentTransitGroup[0]!;
    const lastEdge = currentTransitGroup[currentTransitGroup.length - 1]!;
    const boardStop = stopsMap.get(firstEdge.fromStopId);
    const alightStop = stopsMap.get(lastEdge.toStopId);

    let groupDurationSec = 0;
    let groupDistanceMeters = 0;
    let groupFare = 0;

    for (const e of currentTransitGroup) {
      groupDurationSec += e.durationSeconds;
      groupDistanceMeters += e.distanceMeters;
      groupFare += e.fare;
    }

    // Line geometry collection
    const coords: [number, number][] = [];
    if (boardStop) coords.push([boardStop.longitude, boardStop.latitude]);
    for (const e of currentTransitGroup) {
      if (e.shapeCoordinates && e.shapeCoordinates.length > 0) {
        coords.push(...e.shapeCoordinates);
      }
      const s = stopsMap.get(e.toStopId);
      if (s) coords.push([s.longitude, s.latitude]);
    }
    if (alightStop && coords.length === 0) {
      coords.push([alightStop.longitude, alightStop.latitude]);
    }

    // Deduplicate consecutive coordinates
    const uniqueCoords: [number, number][] = [];
    for (const c of coords) {
      const last = uniqueCoords[uniqueCoords.length - 1];
      if (!last || last[0] !== c[0] || last[1] !== c[1]) {
        uniqueCoords.push(c);
      }
    }

    const durationMin = secondsToMinutes(groupDurationSec);

    segments.push({
      type: 'transit',
      mode: firstEdge.mode,
      routeId: firstEdge.routeId,
      routeName: firstEdge.routeName,
      routeCode: firstEdge.routeCode,
      modeColor: firstEdge.modeColor,
      fromStop: boardStop
        ? {
            id: boardStop.id,
            name: boardStop.name,
            code: boardStop.code || undefined,
            latitude: boardStop.latitude,
            longitude: boardStop.longitude,
          }
        : undefined,
      toStop: alightStop
        ? {
            id: alightStop.id,
            name: alightStop.name,
            code: alightStop.code || undefined,
            latitude: alightStop.latitude,
            longitude: alightStop.longitude,
          }
        : undefined,
      durationMinutes: durationMin,
      distanceMeters: Math.round(groupDistanceMeters),
      fare: groupFare,
      stopsCount: currentTransitGroup.length,
      departureTime: firstEdge.departureTime,
      arrivalTime: lastEdge.arrivalTime,
      instructions: `Board ${firstEdge.routeCode}: ${firstEdge.routeName} at ${boardStop?.name || 'stop'} and alight at ${alightStop?.name || 'stop'} (${currentTransitGroup.length} stops)`,
      geometry:
        uniqueCoords.length >= 2
          ? {
              type: 'LineString',
              coordinates: uniqueCoords,
            }
          : undefined,
    });

    if (!modes.includes(firstEdge.mode)) {
      modes.push(firstEdge.mode);
    }
    totalDurationSeconds += groupDurationSec;
    totalFare += groupFare;
    currentTransitGroup = [];
  };

  let previousRouteId: string | null = null;

  for (const edge of pathData.edges) {
    if ('tripId' in edge) {
      // Transit Edge
      const tEdge = edge as TransitEdge;
      if (previousRouteId && previousRouteId !== tEdge.routeId) {
        flushTransitGroup();
        transitTransferCount++;
      }
      currentTransitGroup.push(tEdge);
      previousRouteId = tEdge.routeId;
    } else {
      // Walking Transfer Edge
      flushTransitGroup();
      previousRouteId = null;
      transitTransferCount++;

      const wEdge = edge as WalkingEdge;
      const fromS = stopsMap.get(wEdge.fromStopId);
      const toS = stopsMap.get(wEdge.toStopId);
      const durationMin = secondsToMinutes(wEdge.durationSeconds);

      segments.push({
        type: 'walking',
        mode: 'walking',
        fromStop: fromS
          ? {
              id: fromS.id,
              name: fromS.name,
              code: fromS.code || undefined,
              latitude: fromS.latitude,
              longitude: fromS.longitude,
            }
          : undefined,
        toStop: toS
          ? {
              id: toS.id,
              name: toS.name,
              code: toS.code || undefined,
              latitude: toS.latitude,
              longitude: toS.longitude,
            }
          : undefined,
        durationMinutes: durationMin,
        distanceMeters: Math.round(wEdge.distanceMeters),
        fare: 0,
        instructions: `Walk ${Math.round(wEdge.distanceMeters)}m transfer to ${toS?.name || 'next stop'}`,
        geometry:
          fromS && toS
            ? {
                type: 'LineString',
                coordinates: [
                  [fromS.longitude, fromS.latitude],
                  [toS.longitude, toS.latitude],
                ],
              }
            : undefined,
      });

      totalDurationSeconds += wEdge.durationSeconds;
      totalWalkingMeters += wEdge.distanceMeters;
    }
  }

  flushTransitGroup();

  // 3. Final Walking Segment from Last Transit Stop -> Destination
  if (pathData.destWalkDistance > 0) {
    const lastStop = stopsMap.get(pathData.lastStopId);
    const durationMin = secondsToMinutes(pathData.destWalkSeconds);

    segments.push({
      type: 'walking',
      mode: 'walking',
      fromStop: lastStop
        ? {
            id: lastStop.id,
            name: lastStop.name,
            code: lastStop.code || undefined,
            latitude: lastStop.latitude,
            longitude: lastStop.longitude,
          }
        : undefined,
      toStop: {
        id: 'destination',
        name: destination.name || 'Destination',
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      durationMinutes: durationMin,
      distanceMeters: Math.round(pathData.destWalkDistance),
      fare: 0,
      instructions: `Walk ${Math.round(pathData.destWalkDistance)}m to ${destination.name || 'destination'}`,
      geometry: lastStop
        ? {
            type: 'LineString',
            coordinates: [
              [lastStop.longitude, lastStop.latitude],
              [destination.longitude, destination.latitude],
            ],
          }
        : undefined,
    });

    if (!modes.includes('walking')) {
      modes.push('walking');
    }
    totalDurationSeconds += pathData.destWalkSeconds;
    totalWalkingMeters += pathData.destWalkDistance;
  }

  // Summary generation
  const transitNames = segments
    .filter((s) => s.type === 'transit' && s.routeCode)
    .map((s) => s.routeCode!);
  const summary =
    transitNames.length > 0 ? `Via ${transitNames.join(' → ')}` : 'Walking direct corridor';

  return {
    id: journeyId,
    durationMinutes: secondsToMinutes(totalDurationSeconds),
    fare: totalFare,
    currency: 'PHP',
    walkingDistanceMeters: Math.round(totalWalkingMeters),
    transfers: transitTransferCount,
    modes,
    routeCodes: transitNames,
    summary,
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
      name: origin.name,
    },
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: destination.name,
    },
    segments,
  };
}

/**
 * Creates a direct walking-only journey.
 */
export function buildWalkingOnlyJourney(
  journeyId: string,
  origin: { latitude: number; longitude: number; name?: string },
  destination: { latitude: number; longitude: number; name?: string },
  distanceMeters: number
): Journey {
  const durationSeconds = calculateWalkingDurationSeconds(distanceMeters);
  const durationMinutes = secondsToMinutes(durationSeconds);

  return {
    id: journeyId,
    label: 'LESS WALKING',
    durationMinutes,
    fare: 0,
    currency: 'PHP',
    walkingDistanceMeters: Math.round(distanceMeters),
    transfers: 0,
    modes: ['walking'],
    routeCodes: [],
    summary: 'Direct Walking Route',
    origin: {
      latitude: origin.latitude,
      longitude: origin.longitude,
      name: origin.name,
    },
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: destination.name,
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
          id: 'destination',
          name: destination.name || 'Destination',
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        durationMinutes,
        distanceMeters: Math.round(distanceMeters),
        fare: 0,
        instructions: `Walk directly to ${destination.name || 'destination'} (${Math.round(distanceMeters)}m)`,
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      },
    ],
  };
}
