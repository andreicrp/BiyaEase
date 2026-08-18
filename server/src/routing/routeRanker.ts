import { Journey } from './graph.types.js';

export function rankAndLabelJourneys(journeys: Journey[], limit: number = 5): Journey[] {
  if (journeys.length === 0) return [];

  // Clone journeys to assign badges
  const ranked = [...journeys];

  // Find best in each dimension
  let fastestIdx = 0;
  let cheapestIdx = 0;
  let leastWalkingIdx = 0;
  let fewestTransfersIdx = 0;

  for (let i = 1; i < ranked.length; i++) {
    const cur = ranked[i]!;
    if (cur.durationMinutes < ranked[fastestIdx]!.durationMinutes) {
      fastestIdx = i;
    }
    if (cur.fare < ranked[cheapestIdx]!.fare) {
      cheapestIdx = i;
    }
    if (cur.walkingDistanceMeters < ranked[leastWalkingIdx]!.walkingDistanceMeters) {
      leastWalkingIdx = i;
    }
    if (cur.transfers < ranked[fewestTransfersIdx]!.transfers) {
      fewestTransfersIdx = i;
    }
  }

  // Label prioritized categories
  ranked[fastestIdx]!.label = 'FASTEST';
  ranked[fastestIdx]!.isRecommended = true;

  if (!ranked[cheapestIdx]!.label) {
    ranked[cheapestIdx]!.label = 'CHEAPEST';
  }
  if (!ranked[leastWalkingIdx]!.label) {
    ranked[leastWalkingIdx]!.label = 'LESS WALKING';
  }
  if (!ranked[fewestTransfersIdx]!.label) {
    ranked[fewestTransfersIdx]!.label = 'FEWER TRANSFERS';
  }

  // Sort: Recommended / Fastest first, then cheapest, then fewest transfers
  ranked.sort((a, b) => {
    if (a.isRecommended) return -1;
    if (b.isRecommended) return 1;
    if (a.durationMinutes !== b.durationMinutes) return a.durationMinutes - b.durationMinutes;
    if (a.fare !== b.fare) return a.fare - b.fare;
    return a.transfers - b.transfers;
  });

  return ranked.slice(0, Math.max(1, limit));
}
