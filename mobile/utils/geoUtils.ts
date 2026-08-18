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
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
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
  const latDelta = Math.max((maxLat - minLat) * paddingFactor, 0.01);
  const lngDelta = Math.max((maxLng - minLng) * paddingFactor, 0.01);

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
