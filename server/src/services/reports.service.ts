import { reportsRepository } from '../repositories/reports.repository.js';
import { CreateReportPayload, ReportType } from '../types/reports.types.js';

const VALID_REPORT_TYPES: ReportType[] = [
  'traffic',
  'crowding',
  'unavailable',
  'delay',
  'route_issue',
  'stop_issue',
  'fare_change',
  'road_blocked',
  'other',
];

export class ReportsService {
  async createReport(userId: string, payload: CreateReportPayload) {
    if (!payload.type || !VALID_REPORT_TYPES.includes(payload.type)) {
      throw new Error(`Invalid report category type. Allowed: ${VALID_REPORT_TYPES.join(', ')}`);
    }

    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error('Report title is required');
    }

    if (
      payload.latitude < -90 ||
      payload.latitude > 90 ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      throw new Error('Invalid coordinate boundaries');
    }

    const durationHours = Math.max(1, Math.min(24, payload.expirationHours || 2));
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

    return reportsRepository.createReport({
      userId,
      type: payload.type,
      latitude: payload.latitude,
      longitude: payload.longitude,
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : undefined,
      expiresAt,
    });
  }

  async getNearbyReports(latitude: number, longitude: number, radiusMeters: number = 5000) {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid query coordinates');
    }
    const safeRadius = Math.max(100, Math.min(50000, radiusMeters));
    return reportsRepository.getNearbyReports(latitude, longitude, safeRadius);
  }

  async getReportById(id: string) {
    const report = await reportsRepository.getReportById(id);
    if (!report) {
      throw new Error('Community report not found');
    }
    return report;
  }

  async confirmReport(reportId: string, userId: string) {
    return reportsRepository.confirmReport(reportId, userId);
  }

  async dismissReport(reportId: string) {
    return reportsRepository.updateReportStatus(reportId, 'dismissed');
  }

  async deleteReport(reportId: string, userId: string) {
    return reportsRepository.deleteReport(reportId, userId);
  }
}

export const reportsService = new ReportsService();
