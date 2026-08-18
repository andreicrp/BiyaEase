import { getDatabasePool } from '../database/index.js';

export interface SystemMetrics {
  totalUsers: number;
  activeReports: number;
  totalSavedPlaces: number;
  totalFavoriteRoutes: number;
  totalGtfsRoutes: number;
  totalGtfsStops: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  savedPlacesCount: number;
  reportsCount: number;
}

export class AdminRepository {
  async getSystemMetrics(): Promise<SystemMetrics> {
    const pool = getDatabasePool();
    if (!pool) {
      return {
        totalUsers: 0,
        activeReports: 0,
        totalSavedPlaces: 0,
        totalFavoriteRoutes: 0,
        totalGtfsRoutes: 0,
        totalGtfsStops: 0,
      };
    }

    const [usersRes, reportsRes, placesRes, favRes, routesRes, stopsRes] = await Promise.all([
      pool.query<{ count: string }>('SELECT COUNT(*) FROM users;'),
      pool.query<{ count: string }>(
        "SELECT COUNT(*) FROM community_reports WHERE status = 'active' AND expires_at > CURRENT_TIMESTAMP;"
      ),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM saved_places;'),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM favorite_routes;'),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM routes;'),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM stops;'),
    ]);

    return {
      totalUsers: parseInt(usersRes.rows[0]?.count || '0', 10),
      activeReports: parseInt(reportsRes.rows[0]?.count || '0', 10),
      totalSavedPlaces: parseInt(placesRes.rows[0]?.count || '0', 10),
      totalFavoriteRoutes: parseInt(favRes.rows[0]?.count || '0', 10),
      totalGtfsRoutes: parseInt(routesRes.rows[0]?.count || '0', 10),
      totalGtfsStops: parseInt(stopsRes.rows[0]?.count || '0', 10),
    };
  }

  async getAllReports(statusFilter?: string): Promise<any[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    let query = `
      SELECT r.id, r.user_id, r.type, r.latitude, r.longitude, r.title, r.description,
             r.expires_at, r.status, r.confirmed_count, r.created_at, r.updated_at,
             u.display_name AS author_name, u.email AS author_email
      FROM community_reports r
      LEFT JOIN users u ON r.user_id = u.id
    `;
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'all') {
      query += ' WHERE r.status = $1';
      params.push(statusFilter);
    }

    query += ' ORDER BY r.created_at DESC LIMIT 100;';
    const res = await pool.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    }));
  }

  async moderateReport(reportId: string, action: 'approve' | 'dismiss' | 'delete'): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    if (action === 'delete') {
      const res = await pool.query('DELETE FROM community_reports WHERE id = $1;', [reportId]);
      return (res.rowCount ?? 0) > 0;
    }

    const newStatus = action === 'dismiss' ? 'dismissed' : 'active';
    const res = await pool.query(
      'UPDATE community_reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
      [newStatus, reportId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<AdminUserRow[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query(`
      SELECT u.id, u.email, u.display_name, u.is_admin, u.created_at, u.last_login_at,
             (SELECT COUNT(*) FROM saved_places sp WHERE sp.user_id = u.id) AS saved_places_count,
             (SELECT COUNT(*) FROM community_reports cr WHERE cr.user_id = u.id) AS reports_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 100;
    `);

    return res.rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      isAdmin: row.is_admin,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
      savedPlacesCount: parseInt(row.saved_places_count || '0', 10),
      reportsCount: parseInt(row.reports_count || '0', 10),
    }));
  }

  async setAdminStatus(userId: string, isAdmin: boolean): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    const res = await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2;', [
      isAdmin,
      userId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const adminRepository = new AdminRepository();
