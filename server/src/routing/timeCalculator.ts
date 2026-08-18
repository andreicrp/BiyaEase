/**
 * GTFS and Transit Travel-Time Calculations
 */

export const WALKING_SPEED_METERS_PER_SECOND = 1.4; // Average Philippine commuter walking speed (~5.0 km/h)

/**
 * Converts GTFS time string (HH:MM:SS or H:MM:SS) into total seconds from midnight.
 * Properly supports overnight service where hours >= 24 (e.g. 25:30:00 -> 91,800s).
 */
export function gtfsTimeToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;

  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  const seconds = parts.length > 2 ? parseInt(parts[2] || '0', 10) : 0;

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculates duration in seconds between departure and arrival GTFS time strings.
 */
export function calculateTimeDifferenceSeconds(departureTime: string, arrivalTime: string): number {
  const depSec = gtfsTimeToSeconds(departureTime);
  const arrSec = gtfsTimeToSeconds(arrivalTime);
  const diff = arrSec - depSec;
  return diff > 0 ? diff : 180; // Minimum 3 minutes fallback if schedule delta is missing
}

/**
 * Calculates walking duration in seconds given distance in meters.
 */
export function calculateWalkingDurationSeconds(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  return Math.ceil(distanceMeters / WALKING_SPEED_METERS_PER_SECOND);
}

/**
 * Converts seconds into rounded minutes (minimum 1 minute).
 */
export function secondsToMinutes(seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.max(1, Math.round(seconds / 60));
}
