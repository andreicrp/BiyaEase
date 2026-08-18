import { Coordinates, calculateHaversineDistance } from '../utils/geoUtils';
import { MatchedRouteProgress } from './navigationTypes';

export class NavigationMatcher {
  /**
   * Projects a point onto a line segment defined by p1 and p2 in Cartesian meters approximation
   */
  private projectPointOnSegment(
    point: Coordinates,
    p1: Coordinates,
    p2: Coordinates
  ): { projected: Coordinates; t: number; distanceMeters: number } {
    const latMid = ((p1.latitude + p2.latitude) / 2) * (Math.PI / 180);
    const mPerDegLat = 111132.954;
    const mPerDegLng = 111412.84 * Math.cos(latMid);

    // Convert to meters relative to p1
    const x = (point.longitude - p1.longitude) * mPerDegLng;
    const y = (point.latitude - p1.latitude) * mPerDegLat;

    const dx = (p2.longitude - p1.longitude) * mPerDegLng;
    const dy = (p2.latitude - p1.latitude) * mPerDegLat;

    const segLenSq = dx * dx + dy * dy;

    if (segLenSq === 0) {
      const dist = calculateHaversineDistance(point, p1);
      return { projected: p1, t: 0, distanceMeters: dist };
    }

    // Dot product projection clamped to [0, 1]
    const t = Math.max(0, Math.min(1, (x * dx + y * dy) / segLenSq));

    const projectedLng = p1.longitude + t * (p2.longitude - p1.longitude);
    const projectedLat = p1.latitude + t * (p2.latitude - p1.latitude);
    const projected: Coordinates = { latitude: projectedLat, longitude: projectedLng };

    const distanceMeters = calculateHaversineDistance(point, projected);
    return { projected, t, distanceMeters };
  }

  /**
   * Matches user GPS location to polyline geometry, computing progress along route and cross-track deviation
   */
  matchLocationToPolyline(
    userLocation: Coordinates,
    polyline: Coordinates[],
    maxCorridorDeviationMeters = 250
  ): MatchedRouteProgress {
    if (!polyline || polyline.length === 0) {
      return {
        closestPoint: userLocation,
        distanceFromRouteMeters: 0,
        progressPercent: 0,
        remainingDistanceMeters: 0,
        isNearRoute: true,
      };
    }

    if (polyline.length === 1) {
      const dist = calculateHaversineDistance(userLocation, polyline[0]!);
      return {
        closestPoint: polyline[0]!,
        distanceFromRouteMeters: dist,
        progressPercent: dist < 30 ? 100 : 0,
        remainingDistanceMeters: dist,
        isNearRoute: dist <= maxCorridorDeviationMeters,
      };
    }

    // 1. Calculate cumulative segment lengths
    const segmentLengths: number[] = [];
    let totalLengthMeters = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
      const segLen = calculateHaversineDistance(polyline[i]!, polyline[i + 1]!);
      segmentLengths.push(segLen);
      totalLengthMeters += segLen;
    }

    // 2. Find closest segment projection
    let minDistance = Infinity;
    let bestProjected: Coordinates = polyline[0]!;
    let bestSegmentIndex = 0;
    let bestT = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
      const { projected, t, distanceMeters } = this.projectPointOnSegment(
        userLocation,
        polyline[i]!,
        polyline[i + 1]!
      );

      if (distanceMeters < minDistance) {
        minDistance = distanceMeters;
        bestProjected = projected;
        bestSegmentIndex = i;
        bestT = t;
      }
    }

    // 3. Compute traveled distance along polyline up to projected point
    let traveledDistanceMeters = 0;
    for (let i = 0; i < bestSegmentIndex; i++) {
      traveledDistanceMeters += segmentLengths[i] || 0;
    }
    traveledDistanceMeters += bestT * (segmentLengths[bestSegmentIndex] || 0);

    const remainingDistanceMeters = Math.max(0, totalLengthMeters - traveledDistanceMeters);
    const progressPercent =
      totalLengthMeters > 0
        ? Math.min(100, Math.max(0, Math.round((traveledDistanceMeters / totalLengthMeters) * 100)))
        : 100;

    return {
      closestPoint: bestProjected,
      distanceFromRouteMeters: Math.round(minDistance),
      progressPercent,
      remainingDistanceMeters: Math.round(remainingDistanceMeters),
      isNearRoute: minDistance <= maxCorridorDeviationMeters,
    };
  }
}

export const navigationMatcher = new NavigationMatcher();
