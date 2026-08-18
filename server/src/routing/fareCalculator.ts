/**
 * Philippine Transit Fare Matrix Calculator
 * Supports LTFRB and Rail Fare matrices (base fare, minimum fare, per-km rate).
 */

export interface FareRule {
  routeId: string;
  modeId: string;
  baseFare: number;
  minimumFare: number;
  perKmRate: number;
  currency: string;
}

// Default Philippine LTFRB & Train statutory regular base fares (PHP ₱)
const DEFAULT_MODE_FARES: Record<string, { base: number; min: number; perKm: number }> = {
  jeepney: { base: 13.0, min: 13.0, perKm: 1.8 },
  bus: { base: 15.0, min: 15.0, perKm: 2.2 },
  mrt: { base: 13.0, min: 13.0, perKm: 1.0 },
  lrt: { base: 15.0, min: 15.0, perKm: 1.2 },
  uvexpress: { base: 25.0, min: 25.0, perKm: 2.5 },
  tricycle: { base: 12.0, min: 12.0, perKm: 2.0 },
  walking: { base: 0.0, min: 0.0, perKm: 0.0 },
};

/**
 * Calculates fare for a transit segment given distance and fare rule.
 */
export function calculateSegmentFare(
  mode: string,
  distanceMeters: number,
  rule?: FareRule
): number {
  if (mode === 'walking') {
    return 0;
  }

  const distanceKm = distanceMeters / 1000;

  if (rule) {
    // First 4km uses minimum / base fare, subsequent distance adds per-km rate
    const extraKm = Math.max(0, distanceKm - 4);
    const calculated = rule.baseFare + extraKm * rule.perKmRate;
    return Math.round(Math.max(rule.minimumFare, calculated));
  }

  const defaultRule = DEFAULT_MODE_FARES[mode] || DEFAULT_MODE_FARES.jeepney!;
  const extraKm = Math.max(0, distanceKm - 4);
  const calculated = defaultRule.base + extraKm * defaultRule.perKm;
  return Math.round(Math.max(defaultRule.min, calculated));
}
