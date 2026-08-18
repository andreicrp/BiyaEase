import { RawGtfsStopTime } from '../types/gtfs.types.js';
import { ValidationIssue } from '../types/report.types.js';

export function validateStopTimes(
  stopTimes: RawGtfsStopTime[],
  validTripIds: Set<string>,
  validStopIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tripSequences = new Map<string, Set<number>>();

  if (stopTimes.length === 0) {
    issues.push({
      file: 'stop_times.txt',
      message: 'stop_times.txt is empty or contains no valid records.',
      severity: 'ERROR',
    });
    return issues;
  }

  stopTimes.forEach((st, index) => {
    const line = index + 2;
    const tripId = st.trip_id?.trim();
    const stopId = st.stop_id?.trim();
    const seqStr = st.stop_sequence?.trim();
    const seq = parseInt(seqStr, 10);

    if (!tripId || !validTripIds.has(tripId)) {
      issues.push({
        file: 'stop_times.txt',
        line,
        field: 'trip_id',
        message: `stop_time row references non-existent trip_id "${tripId}".`,
        severity: 'ERROR',
      });
    }

    if (!stopId || !validStopIds.has(stopId)) {
      issues.push({
        file: 'stop_times.txt',
        line,
        field: 'stop_id',
        message: `stop_time row references non-existent stop_id "${stopId}".`,
        severity: 'ERROR',
      });
    }

    if (isNaN(seq) || seq <= 0) {
      issues.push({
        file: 'stop_times.txt',
        line,
        field: 'stop_sequence',
        message: `Invalid stop_sequence "${seqStr}" for trip "${tripId}". Must be positive integer > 0.`,
        severity: 'ERROR',
        entityId: tripId,
      });
      return;
    }

    if (tripId) {
      if (!tripSequences.has(tripId)) {
        tripSequences.set(tripId, new Set());
      }
      const existing = tripSequences.get(tripId)!;
      if (existing.has(seq)) {
        issues.push({
          file: 'stop_times.txt',
          line,
          field: 'stop_sequence',
          message: `Duplicate stop_sequence "${seq}" for trip "${tripId}".`,
          severity: 'ERROR',
          entityId: tripId,
        });
      }
      existing.add(seq);
    }
  });

  return issues;
}
