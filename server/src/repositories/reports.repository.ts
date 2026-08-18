import { getDatabasePool } from '../database/index.js';
import { DbCommunityReport, ReportType } from '../types/reports.types.js';
import { logger } from '../utils/logger.js';

export class ReportsRepository {
  async createReport(report: {
    userId: string;
    type: ReportType;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
    expiresAt: Date;
  }): Promise<DbCommunityReport> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const res = await pool.query<DbCommunityReport>(
      `INSERT INTO community_reports (
         user_id, type, location, latitude, longitude, title, description, expires_at
       )
       VALUES (
         $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $4, $3, $5, $6, $7
       )
       RETURNING id, user_id, type, latitude, longitude, title, description, expires_at, status, confirmed_count, created_at, updated_at;`,
      [
        report.userId,
        report.type,
        report.longitude,
        report.latitude,
        report.title,
        report.description || null,
        report.expiresAt,
      ]
    );

    logger.info(`[REPORTS] Created community report: ${res.rows[0]?.id} (${report.type})`);
    return res.rows[0]!;
  }

  async getNearbyReports(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<DbCommunityReport[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<DbCommunityReport>(
      `SELECT r.id, r.user_id, r.type, r.latitude, r.longitude, r.title, r.description,
              r.expires_at, r.status, r.confirmed_count, r.created_at, r.updated_at,
              u.display_name AS author_name,
              ROUND(ST_Distance(r.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) AS distance_meters
       FROM community_reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.status = 'active'
         AND r.expires_at > CURRENT_TIMESTAMP
         AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance_meters ASC, r.created_at DESC;`,
      [longitude, latitude, radiusMeters]
    );

    return res.rows.map((r) => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      distance_meters: r.distance_meters ? Number(r.distance_meters) : 0,
    }));
  }

  async getReportById(id: string): Promise<DbCommunityReport | null> {
    const pool = getDatabasePool();
    if (!pool) return null;

    const res = await pool.query<DbCommunityReport>(
      `SELECT r.*, u.display_name AS author_name
       FROM community_reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 LIMIT 1;`,
      [id]
    );

    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    };
  }

  async confirmReport(
    reportId: string,
    userId: string
  ): Promise<{ success: boolean; confirmedCount: number }> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(
        'SELECT id FROM report_confirmations WHERE report_id = $1 AND user_id = $2;',
        [reportId, userId]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('You have already confirmed this report');
      }

      await client.query('INSERT INTO report_confirmations (report_id, user_id) VALUES ($1, $2);', [
        reportId,
        userId,
      ]);

      const updated = await client.query<{ confirmed_count: number }>(
        'UPDATE community_reports SET confirmed_count = confirmed_count + 1 WHERE id = $1 RETURNING confirmed_count;',
        [reportId]
      );

      await client.query('COMMIT');
      return {
        success: true,
        confirmedCount: updated.rows[0]?.confirmed_count || 1,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateReportStatus(reportId: string, status: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    const res = await pool.query(
      'UPDATE community_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
      [status, reportId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async deleteReport(reportId: string, userId: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    const res = await pool.query('DELETE FROM community_reports WHERE id = $1 AND user_id = $2;', [
      reportId,
      userId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const reportsRepository = new ReportsRepository();
