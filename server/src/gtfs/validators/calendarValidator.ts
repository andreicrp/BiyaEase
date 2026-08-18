import { RawGtfsCalendar } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateCalendar(calendar: RawGtfsCalendar[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenServiceIds = new Set<string>();

  calendar.forEach((cal, index) => {
    const line = index + 2;
    const serviceId = cal.service_id?.trim();

    if (!serviceId) {
      issues.push({
        file: 'calendar.txt',
        line,
        field: 'service_id',
        message: 'Missing service_id in calendar.txt.',
        severity: 'ERROR',
      });
      return;
    }

    if (seenServiceIds.has(serviceId)) {
      issues.push({
        file: 'calendar.txt',
        line,
        field: 'service_id',
        message: `Duplicate service_id "${serviceId}".`,
        severity: 'ERROR',
        entityId: serviceId,
      });
    }
    seenServiceIds.add(serviceId);

    const hasActiveDay = [
      cal.monday,
      cal.tuesday,
      cal.wednesday,
      cal.thursday,
      cal.friday,
      cal.saturday,
      cal.sunday,
    ].some((val) => val === '1' || val?.toLowerCase() === 'true');

    if (!hasActiveDay) {
      issues.push({
        file: 'calendar.txt',
        line,
        message: `Service "${serviceId}" has no active operating days.`,
        severity: 'WARNING',
        entityId: serviceId,
      });
    }

    if (!cal.start_date || !cal.end_date) {
      issues.push({
        file: 'calendar.txt',
        line,
        message: `Service "${serviceId}" is missing start_date or end_date.`,
        severity: 'ERROR',
        entityId: serviceId,
      });
    }
  });

  return issues;
}
