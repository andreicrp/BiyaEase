import { RawGtfsStop } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateStops(stops: RawGtfsStop[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenStopIds = new Set<string>();

  if (stops.length === 0) {
    issues.push({
      file: 'stops.txt',
      message: 'stops.txt is empty or contains no valid stop records.',
      severity: 'ERROR',
    });
    return issues;
  }

  stops.forEach((stop, index) => {
    const line = index + 2;
    const stopId = stop.stop_id?.trim();

    if (!stopId) {
      issues.push({
        file: 'stops.txt',
        line,
        field: 'stop_id',
        message: 'Missing required stop_id.',
        severity: 'ERROR',
      });
      return;
    }

    if (seenStopIds.has(stopId)) {
      issues.push({
        file: 'stops.txt',
        line,
        field: 'stop_id',
        message: `Duplicate stop_id "${stopId}".`,
        severity: 'ERROR',
        entityId: stopId,
      });
    }
    seenStopIds.add(stopId);

    if (!stop.stop_name || stop.stop_name.trim().length === 0) {
      issues.push({
        file: 'stops.txt',
        line,
        field: 'stop_name',
        message: `Stop "${stopId}" is missing stop_name.`,
        severity: 'ERROR',
        entityId: stopId,
      });
    }

    // Coordinate validation
    const lat = parseFloat(stop.stop_lat);
    const lon = parseFloat(stop.stop_lon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      issues.push({
        file: 'stops.txt',
        line,
        field: 'stop_lat',
        message: `Stop "${stopId}" has invalid latitude "${stop.stop_lat}". Must be between -90 and 90.`,
        severity: 'ERROR',
        entityId: stopId,
      });
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      issues.push({
        file: 'stops.txt',
        line,
        field: 'stop_lon',
        message: `Stop "${stopId}" has invalid longitude "${stop.stop_lon}". Must be between -180 and 180.`,
        severity: 'ERROR',
        entityId: stopId,
      });
    }

    // Warning if outside Philippine territorial boundaries (Latitude 4° to 22° N, Longitude 116° to 127° E)
    if (!isNaN(lat) && !isNaN(lon)) {
      if (lat < 4.0 || lat > 22.0 || lon < 116.0 || lon > 127.0) {
        issues.push({
          file: 'stops.txt',
          line,
          field: 'coordinates',
          message: `Stop "${stopId}" coordinates (${lat}, ${lon}) appear outside Philippine territorial bounds.`,
          severity: 'WARNING',
          entityId: stopId,
        });
      }
    }
  });

  return issues;
}
