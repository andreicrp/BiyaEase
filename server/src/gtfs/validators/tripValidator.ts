import { RawGtfsTrip } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateTrips(
  trips: RawGtfsTrip[],
  validRouteIds: Set<string>,
  validServiceIds: Set<string>,
  validShapeIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenTripIds = new Set<string>();

  if (trips.length === 0) {
    issues.push({
      file: 'trips.txt',
      message: 'trips.txt is empty or contains no valid trip records.',
      severity: 'ERROR',
    });
    return issues;
  }

  trips.forEach((trip, index) => {
    const line = index + 2;
    const tripId = trip.trip_id?.trim();
    const routeId = trip.route_id?.trim();
    const serviceId = trip.service_id?.trim();
    const shapeId = trip.shape_id?.trim();

    if (!tripId) {
      issues.push({
        file: 'trips.txt',
        line,
        field: 'trip_id',
        message: 'Missing required trip_id.',
        severity: 'ERROR',
      });
      return;
    }

    if (seenTripIds.has(tripId)) {
      issues.push({
        file: 'trips.txt',
        line,
        field: 'trip_id',
        message: `Duplicate trip_id "${tripId}".`,
        severity: 'ERROR',
        entityId: tripId,
      });
    }
    seenTripIds.add(tripId);

    if (!routeId || !validRouteIds.has(routeId)) {
      issues.push({
        file: 'trips.txt',
        line,
        field: 'route_id',
        message: `Trip "${tripId}" references non-existent route_id "${routeId}".`,
        severity: 'ERROR',
        entityId: tripId,
      });
    }

    if (serviceId && validServiceIds.size > 0 && !validServiceIds.has(serviceId)) {
      issues.push({
        file: 'trips.txt',
        line,
        field: 'service_id',
        message: `Trip "${tripId}" references non-existent service_id "${serviceId}".`,
        severity: 'WARNING',
        entityId: tripId,
      });
    }

    if (shapeId && validShapeIds.size > 0 && !validShapeIds.has(shapeId)) {
      issues.push({
        file: 'trips.txt',
        line,
        field: 'shape_id',
        message: `Trip "${tripId}" references non-existent shape_id "${shapeId}".`,
        severity: 'WARNING',
        entityId: tripId,
      });
    }
  });

  return issues;
}
