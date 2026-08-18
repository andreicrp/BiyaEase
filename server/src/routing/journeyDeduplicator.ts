import { Journey } from './graph.types.js';

/**
 * Creates a unique deterministic signature for a journey.
 */
export function getJourneySignature(journey: Journey): string {
  const parts = journey.segments.map((seg) => {
    if (seg.type === 'walking') {
      return `w:${seg.fromStop?.id || 'orig'}->${seg.toStop?.id || 'dest'}:${Math.round(seg.distanceMeters / 50) * 50}`;
    }
    return `t:${seg.routeId || seg.mode}:${seg.fromStop?.id}->${seg.toStop?.id}`;
  });
  return parts.join('|');
}

/**
 * Removes duplicate journeys with identical route signatures, keeping the lowest duration variant.
 */
export function deduplicateJourneys(journeys: Journey[]): Journey[] {
  const seenSignatures = new Map<string, Journey>();

  for (const j of journeys) {
    const sig = getJourneySignature(j);
    const existing = seenSignatures.get(sig);

    if (!existing) {
      seenSignatures.set(sig, j);
    } else {
      // If duration is lower or fare is lower, replace
      if (
        j.durationMinutes < existing.durationMinutes ||
        (j.durationMinutes === existing.durationMinutes && j.fare < existing.fare)
      ) {
        seenSignatures.set(sig, j);
      }
    }
  }

  return Array.from(seenSignatures.values());
}
