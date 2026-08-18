import { RawGtfsRoute } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateRoutes(
  routes: RawGtfsRoute[],
  validAgencyIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenRouteIds = new Set<string>();

  if (routes.length === 0) {
    issues.push({
      file: 'routes.txt',
      message: 'routes.txt is empty or contains no valid route records.',
      severity: 'ERROR',
    });
    return issues;
  }

  routes.forEach((route, index) => {
    const line = index + 2;
    const routeId = route.route_id?.trim();

    if (!routeId) {
      issues.push({
        file: 'routes.txt',
        line,
        field: 'route_id',
        message: 'Missing required route_id.',
        severity: 'ERROR',
      });
      return;
    }

    if (seenRouteIds.has(routeId)) {
      issues.push({
        file: 'routes.txt',
        line,
        field: 'route_id',
        message: `Duplicate route_id "${routeId}".`,
        severity: 'ERROR',
        entityId: routeId,
      });
    }
    seenRouteIds.add(routeId);

    if (!route.route_short_name && !route.route_long_name) {
      issues.push({
        file: 'routes.txt',
        line,
        field: 'route_short_name / route_long_name',
        message: `Route "${routeId}" must have at least route_short_name or route_long_name.`,
        severity: 'ERROR',
        entityId: routeId,
      });
    }

    if (route.route_type === undefined || route.route_type.trim() === '') {
      issues.push({
        file: 'routes.txt',
        line,
        field: 'route_type',
        message: `Route "${routeId}" is missing route_type.`,
        severity: 'ERROR',
        entityId: routeId,
      });
    }

    if (route.agency_id && validAgencyIds.size > 0 && !validAgencyIds.has(route.agency_id.trim())) {
      issues.push({
        file: 'routes.txt',
        line,
        field: 'agency_id',
        message: `Route "${routeId}" references non-existent agency_id "${route.agency_id}".`,
        severity: 'WARNING',
        entityId: routeId,
      });
    }
  });

  return issues;
}
