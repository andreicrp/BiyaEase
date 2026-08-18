/**
 * BiyaEase Geospatial & Map Utilities
 * Handles GeoJSON coordinate conversions, bounding box calculations,
 * Mercator projections, and distance formatting.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Converts GeoJSON [longitude, latitude] array to { latitude, longitude }
 */
export function geoJsonToCoordinate(coord: [number, number]): Coordinates {
  return {
    longitude: coord[0],
    latitude: coord[1],
  };
}

/**
 * Converts GeoJSON LineString coordinates array [[lng, lat], ...] to Coordinates[]
 */
export function geoJsonLineStringToCoordinates(coords: [number, number][]): Coordinates[] {
  if (!Array.isArray(coords)) return [];
  return coords.map(geoJsonToCoordinate);
}

/**
 * Computes bounding box and MapRegion for an array of coordinates
 */
export function calculateRegionForCoordinates(
  coords: Coordinates[],
  paddingFactor: number = 1.3
): MapRegion {
  if (!coords || coords.length === 0) {
    // Default to Metro Manila center (Quezon City / Manila)
    return {
      latitude: 14.6538,
      longitude: 121.0488,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }

  if (coords.length === 1) {
    const single = coords[0]!;
    return {
      latitude: single.latitude,
      longitude: single.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  }

  let minLat = coords[0]!.latitude;
  let maxLat = coords[0]!.latitude;
  let minLng = coords[0]!.longitude;
  let maxLng = coords[0]!.longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = Math.max((maxLat - minLat) * paddingFactor, 0.012);
  const lngDelta = Math.max((maxLng - minLng) * paddingFactor, 0.012);

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * Calculates Haversine distance in meters between two coordinates
 */
export function computeDistanceMeters(c1: Coordinates, c2: Coordinates): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLng = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const lat1 = (c1.latitude * Math.PI) / 180;
  const lat2 = (c2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const calculateHaversineDistance = computeDistanceMeters;
export const calculateDistanceMeters = computeDistanceMeters;

/**
 * Formats distance in meters for display (e.g. "450 m" or "1.8 km")
 */
export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Validates if latitude and longitude are within standard geographical boundaries
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Detailed Metro Manila Arterial Transit Road Corridor Networks (EDSA, Commonwealth, North Ave, Quezon Ave, Aurora Blvd)
 */
export const METRO_MANILA_CORRIDOR_NETWORKS: Coordinates[] = [
  // UP Diliman -> Philcoa -> Elliptical Road -> North Avenue -> SM North EDSA Spine
  { latitude: 14.6538, longitude: 121.0685 }, // 0. UP Diliman (Vinzons / Univ Ave)
  { latitude: 14.6532, longitude: 121.0612 }, // 1. University Ave / C.P. Garcia
  { latitude: 14.6542, longitude: 121.0535 }, // 2. Philcoa Footbridge / Commonwealth
  { latitude: 14.6515, longitude: 121.0488 }, // 3. Quezon Memorial Circle / Elliptical Rd
  { latitude: 14.6536, longitude: 121.0410 }, // 4. North Ave / Veterans Memorial Hospital
  { latitude: 14.6558, longitude: 121.0332 }, // 5. North Ave / Trinoma Entrance
  { latitude: 14.6565, longitude: 121.0288 }, // 6. SM North EDSA Main Terminal

  // EDSA North -> Quezon Ave -> East Ave -> Cubao Spine
  { latitude: 14.6425, longitude: 121.0384 }, // 7. EDSA / Quezon Ave Interchange
  { latitude: 14.6445, longitude: 121.0478 }, // 8. East Ave / Heart Center
  { latitude: 14.6365, longitude: 121.0435 }, // 9. EDSA / Kamuning MRT
  { latitude: 14.6195, longitude: 121.0512 }, // 10. EDSA / Cubao MRT Station
  { latitude: 14.6185, longitude: 121.0532 }, // 11. Araneta City / Farmers Plaza

  // Quezon Ave -> España -> Manila Spine
  { latitude: 14.6325, longitude: 121.0185 }, // 12. Quezon Ave / Fisher Mall
  { latitude: 14.6212, longitude: 121.0025 }, // 13. Welcome Rotonda
  { latitude: 14.6085, longitude: 120.9912 }, // 14. UST / España Blvd

  // Aurora Blvd / Katipunan LRT-2 Spine
  { latitude: 14.6318, longitude: 121.0740 }, // 15. Katipunan LRT-2 Station
];

/**
 * Takes any sparse set of coordinates (e.g. 2 endpoints) and converts them into
 * a smooth street-following road path along Metro Manila transit corridors.
 */
export function interpolateRoadCorridor(coords: Coordinates[]): Coordinates[] {
  // Fallback to UP Diliman -> SM North EDSA street corridor if empty
  if (!coords || coords.length === 0) {
    return METRO_MANILA_CORRIDOR_NETWORKS.slice(0, 7);
  }

  // If already detailed multi-point geometry (> 6 points), return as-is
  if (coords.length >= 6) {
    return coords;
  }

  const result: Coordinates[] = [];

  for (let i = 0; i < coords.length; i++) {
    const pt = coords[i]!;
    result.push(pt);

    if (i < coords.length - 1) {
      const nextPt = coords[i + 1]!;
      const dist = computeDistanceMeters(pt, nextPt);

      // If segment spans across Metro Manila transit corridor (> 300m)
      if (dist > 300) {
        const minLng = Math.min(pt.longitude, nextPt.longitude) - 0.008;
        const maxLng = Math.max(pt.longitude, nextPt.longitude) + 0.008;
        const minLat = Math.min(pt.latitude, nextPt.latitude) - 0.008;
        const maxLat = Math.max(pt.latitude, nextPt.latitude) + 0.008;

        // Find candidate corridor waypoints inside the bounding box
        const candidateWaypoints = METRO_MANILA_CORRIDOR_NETWORKS.filter((w) => {
          return (
            w.longitude >= minLng &&
            w.longitude <= maxLng &&
            w.latitude >= minLat &&
            w.latitude <= maxLat
          );
        });

        // Sort waypoints sequentially along the directional vector from pt -> nextPt
        candidateWaypoints.sort((a, b) => {
          const distA = computeDistanceMeters(pt, a);
          const distB = computeDistanceMeters(pt, b);
          return distA - distB;
        });

        candidateWaypoints.forEach((w) => {
          const distFromStart = computeDistanceMeters(pt, w);
          const distFromEnd = computeDistanceMeters(nextPt, w);

          if (distFromStart > 100 && distFromEnd > 100) {
            // Avoid duplicate contiguous points
            const last = result[result.length - 1];
            if (!last || computeDistanceMeters(last, w) > 50) {
              result.push(w);
            }
          }
        });
      }
    }
  }

  // Ensure output has at least 3 points for smooth curved path rendering
  if (result.length < 3) {
    const start = coords[0]!;
    const end = coords[coords.length - 1]!;

    // Generate intermediate arc road point
    const midLat = (start.latitude + end.latitude) / 2 - 0.0018;
    const midLng = (start.longitude + end.longitude) / 2 + 0.0015;

    return [start, { latitude: midLat, longitude: midLng }, end];
  }

  return result;
}
