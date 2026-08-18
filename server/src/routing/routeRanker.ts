import { Journey, RouteRecommendation } from './graph.types.js';

export function rankAndLabelJourneys(journeys: Journey[], limit: number = 5): Journey[] {
  if (journeys.length === 0) return [];

  const maxLimit = Math.min(Math.max(1, limit), 10);

  // Clone journeys and ensure routeCodes & recommendations array are initialized
  const ranked: Journey[] = journeys.map((j) => {
    const routeCodes: string[] = [];
    j.segments.forEach((seg) => {
      if (seg.type === 'transit' && seg.routeCode && !routeCodes.includes(seg.routeCode)) {
        routeCodes.push(seg.routeCode);
      }
    });

    return {
      ...j,
      routeCodes: j.routeCodes || routeCodes,
      recommendations: [] as RouteRecommendation[],
    };
  });

  // 1. Determine Fastest (Primary: duration ASC, Secondary: transfers ASC, Tertiary: walk ASC)
  let fastestIdx = 0;
  for (let i = 1; i < ranked.length; i++) {
    const cur = ranked[i]!;
    const best = ranked[fastestIdx]!;

    if (
      cur.durationMinutes < best.durationMinutes ||
      (cur.durationMinutes === best.durationMinutes && cur.transfers < best.transfers) ||
      (cur.durationMinutes === best.durationMinutes &&
        cur.transfers === best.transfers &&
        cur.walkingDistanceMeters < best.walkingDistanceMeters)
    ) {
      fastestIdx = i;
    }
  }

  // 2. Determine Cheapest (Primary: fare ASC, Secondary: duration ASC, Tertiary: transfers ASC)
  let cheapestIdx = 0;
  for (let i = 1; i < ranked.length; i++) {
    const cur = ranked[i]!;
    const best = ranked[cheapestIdx]!;

    if (
      cur.fare < best.fare ||
      (cur.fare === best.fare && cur.durationMinutes < best.durationMinutes) ||
      (cur.fare === best.fare &&
        cur.durationMinutes === best.durationMinutes &&
        cur.transfers < best.transfers)
    ) {
      cheapestIdx = i;
    }
  }

  // 3. Determine Least Walking (Primary: walk ASC, Secondary: transfers ASC, Tertiary: duration ASC)
  let leastWalkingIdx = 0;
  for (let i = 1; i < ranked.length; i++) {
    const cur = ranked[i]!;
    const best = ranked[leastWalkingIdx]!;

    if (
      cur.walkingDistanceMeters < best.walkingDistanceMeters ||
      (cur.walkingDistanceMeters === best.walkingDistanceMeters &&
        cur.transfers < best.transfers) ||
      (cur.walkingDistanceMeters === best.walkingDistanceMeters &&
        cur.transfers === best.transfers &&
        cur.durationMinutes < best.durationMinutes)
    ) {
      leastWalkingIdx = i;
    }
  }

  // 4. Determine Fewest Transfers (Primary: transfers ASC, Secondary: duration ASC, Tertiary: walk ASC)
  let fewestTransfersIdx = 0;
  for (let i = 1; i < ranked.length; i++) {
    const cur = ranked[i]!;
    const best = ranked[fewestTransfersIdx]!;

    if (
      cur.transfers < best.transfers ||
      (cur.transfers === best.transfers && cur.durationMinutes < best.durationMinutes) ||
      (cur.transfers === best.transfers &&
        cur.durationMinutes === best.durationMinutes &&
        cur.walkingDistanceMeters < best.walkingDistanceMeters)
    ) {
      fewestTransfersIdx = i;
    }
  }

  // Assign recommendation flags
  const addRec = (idx: number, rec: RouteRecommendation) => {
    if (!ranked[idx]!.recommendations) ranked[idx]!.recommendations = [];
    if (!ranked[idx]!.recommendations!.includes(rec)) {
      ranked[idx]!.recommendations!.push(rec);
    }
  };

  addRec(fastestIdx, 'fastest');
  addRec(cheapestIdx, 'cheapest');
  addRec(leastWalkingIdx, 'least_walking');
  addRec(fewestTransfersIdx, 'fewest_transfers');

  // Assign primary recommendation & display badge
  ranked.forEach((j, idx) => {
    if (idx === fastestIdx) {
      j.recommendation = 'fastest';
      j.label = 'FASTEST';
      j.isRecommended = true;
    } else if (idx === cheapestIdx) {
      j.recommendation = 'cheapest';
      j.label = 'CHEAPEST';
    } else if (idx === leastWalkingIdx) {
      j.recommendation = 'least_walking';
      j.label = 'LESS WALKING';
    } else if (idx === fewestTransfersIdx) {
      j.recommendation = 'fewest_transfers';
      j.label = 'FEWER TRANSFERS';
    }
  });

  // Sort: Recommended / Fastest first, then cheapest, then least walking
  ranked.sort((a, b) => {
    if (a.isRecommended) return -1;
    if (b.isRecommended) return 1;
    if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes;
    if (a.fare !== b.fare) return a.fare - b.fare;
    return a.transfers - b.transfers;
  });

  return ranked.slice(0, maxLimit);
}
