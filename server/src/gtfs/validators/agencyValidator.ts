import { RawGtfsAgency } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateAgencies(agencies: RawGtfsAgency[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  if (agencies.length === 0) {
    issues.push({
      file: 'agency.txt',
      message: 'agency.txt is empty or contains no valid agency records.',
      severity: 'ERROR',
    });
    return issues;
  }

  agencies.forEach((agency, index) => {
    const line = index + 2;
    const agencyId = agency.agency_id?.trim() || agency.agency_name?.trim();

    if (!agency.agency_name || agency.agency_name.trim().length === 0) {
      issues.push({
        file: 'agency.txt',
        line,
        field: 'agency_name',
        message: 'Missing required agency_name.',
        severity: 'ERROR',
        entityId: agencyId,
      });
    }

    if (!agency.agency_url || agency.agency_url.trim().length === 0) {
      issues.push({
        file: 'agency.txt',
        line,
        field: 'agency_url',
        message: 'Missing agency_url.',
        severity: 'WARNING',
        entityId: agencyId,
      });
    }

    if (agency.agency_id) {
      if (seenIds.has(agency.agency_id)) {
        issues.push({
          file: 'agency.txt',
          line,
          field: 'agency_id',
          message: `Duplicate agency_id "${agency.agency_id}".`,
          severity: 'ERROR',
          entityId: agency.agency_id,
        });
      }
      seenIds.add(agency.agency_id);
    }
  });

  return issues;
}
