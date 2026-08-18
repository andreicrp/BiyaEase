import { getDatabasePool } from '../database/index.js';

export interface AdminGtfsRoute {
  id: string;
  agency_id?: string;
  mode_id?: string;
  code: string;
  name: string;
  description?: string;
  route_color?: string;
}

export interface AdminGtfsStop {
  id: string;
  code?: string;
  name: string;
  latitude: number;
  longitude: number;
}

export class GtfsAdminRepository {
  async getAgencies(): Promise<any[]> {
    const pool = getDatabasePool();
    if (!pool) return [];
    const res = await pool.query('SELECT * FROM agencies ORDER BY name ASC;');
    return res.rows;
  }

  async getRoutes(): Promise<AdminGtfsRoute[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<AdminGtfsRoute>(`
      SELECT id, agency_id, mode_id, code, name, description, route_color
      FROM routes
      ORDER BY code ASC;
    `);

    return res.rows;
  }

  async createOrUpdateRoute(route: {
    id: string;
    agencyId?: string;
    modeId?: string;
    code: string;
    name: string;
    description?: string;
    routeColor?: string;
  }): Promise<AdminGtfsRoute> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    let modeId = route.modeId;
    if (!modeId) {
      const modeRes = await pool.query('SELECT id FROM transit_modes LIMIT 1;');
      modeId = modeRes.rows[0]?.id || 'bus';
    }

    const res = await pool.query<AdminGtfsRoute>(
      `INSERT INTO routes (id, agency_id, mode_id, code, name, description, route_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         agency_id = EXCLUDED.agency_id,
         mode_id = EXCLUDED.mode_id,
         code = EXCLUDED.code,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         route_color = EXCLUDED.route_color,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [
        route.id,
        route.agencyId || null,
        modeId,
        route.code,
        route.name,
        route.description || null,
        route.routeColor || '0284C7',
      ]
    );

    return res.rows[0]!;
  }

  async deleteRoute(id: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;
    const res = await pool.query('DELETE FROM routes WHERE id = $1;', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getStops(limit: number = 100): Promise<AdminGtfsStop[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<AdminGtfsStop>(
      `SELECT id, code, name, ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude
       FROM stops
       ORDER BY name ASC
       LIMIT $1;`,
      [limit]
    );

    return res.rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    }));
  }

  async createOrUpdateStop(stop: {
    id: string;
    code?: string;
    name: string;
    latitude: number;
    longitude: number;
  }): Promise<AdminGtfsStop> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const res = await pool.query<AdminGtfsStop>(
      `INSERT INTO stops (id, code, name, latitude, longitude, location)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code,
         name = EXCLUDED.name,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         location = EXCLUDED.location,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, code, name, latitude, longitude;`,
      [stop.id, stop.code || null, stop.name, stop.latitude, stop.longitude]
    );

    const row = res.rows[0]!;
    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
  }

  async deleteStop(id: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;
    const res = await pool.query('DELETE FROM stops WHERE id = $1;', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const gtfsAdminRepository = new GtfsAdminRepository();
