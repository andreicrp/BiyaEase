import { getDatabasePool } from '../database/index.js';

export interface DbSavedPlace {
  id: string;
  user_id: string;
  device_id?: string;
  name: string;
  label?: string;
  latitude: number;
  longitude: number;
  location_type?: string;
  subtitle?: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbFavoriteRoute {
  id: string;
  user_id: string;
  device_id?: string;
  display_name: string;
  origin: any;
  destination: any;
  journey_reference?: any;
  mode_summary?: string[];
  estimated_duration_minutes?: number;
  estimated_fare?: number;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class SavedDataRepository {
  // ----------------------------------------------------
  // Saved Places Database Operations
  // ----------------------------------------------------
  async getSavedPlacesByUserId(userId: string): Promise<DbSavedPlace[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<DbSavedPlace>(
      'SELECT * FROM saved_places WHERE user_id = $1 ORDER BY created_at DESC;',
      [userId]
    );
    return res.rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    }));
  }

  async saveSavedPlace(place: {
    id: string;
    userId: string;
    name: string;
    latitude: number;
    longitude: number;
    subtitle?: string;
    category: string;
    locationType?: string;
  }): Promise<DbSavedPlace> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const res = await pool.query<DbSavedPlace>(
      `INSERT INTO saved_places (id, user_id, name, latitude, longitude, subtitle, category, location_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         subtitle = EXCLUDED.subtitle,
         category = EXCLUDED.category,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [
        place.id,
        place.userId,
        place.name,
        place.latitude,
        place.longitude,
        place.subtitle || null,
        place.category,
        place.locationType || 'place',
      ]
    );

    const row = res.rows[0]!;
    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
  }

  async deleteSavedPlace(id: string, userId: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    const res = await pool.query('DELETE FROM saved_places WHERE id = $1 AND user_id = $2;', [
      id,
      userId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  // ----------------------------------------------------
  // Favorite Routes Database Operations
  // ----------------------------------------------------
  async getFavoriteRoutesByUserId(userId: string): Promise<DbFavoriteRoute[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<DbFavoriteRoute>(
      'SELECT * FROM favorite_routes WHERE user_id = $1 ORDER BY COALESCE(last_used_at, created_at) DESC;',
      [userId]
    );
    return res.rows.map((row) => ({
      ...row,
      estimated_duration_minutes: row.estimated_duration_minutes
        ? Number(row.estimated_duration_minutes)
        : undefined,
      estimated_fare: row.estimated_fare ? Number(row.estimated_fare) : undefined,
    }));
  }

  async saveFavoriteRoute(route: {
    id: string;
    userId: string;
    displayName: string;
    origin: any;
    destination: any;
    journeyReference?: any;
    modeSummary?: string[];
    estimatedDurationMinutes?: number;
    estimatedFare?: number;
  }): Promise<DbFavoriteRoute> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const res = await pool.query<DbFavoriteRoute>(
      `INSERT INTO favorite_routes (id, user_id, display_name, origin, destination, journey_reference, mode_summary, estimated_duration_minutes, estimated_fare)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         origin = EXCLUDED.origin,
         destination = EXCLUDED.destination,
         journey_reference = EXCLUDED.journey_reference,
         mode_summary = EXCLUDED.mode_summary,
         estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
         estimated_fare = EXCLUDED.estimated_fare,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *;`,
      [
        route.id,
        route.userId,
        route.displayName,
        JSON.stringify(route.origin),
        JSON.stringify(route.destination),
        route.journeyReference ? JSON.stringify(route.journeyReference) : null,
        route.modeSummary || [],
        route.estimatedDurationMinutes || null,
        route.estimatedFare || null,
      ]
    );

    return res.rows[0]!;
  }

  async deleteFavoriteRoute(id: string, userId: string): Promise<boolean> {
    const pool = getDatabasePool();
    if (!pool) return false;

    const res = await pool.query('DELETE FROM favorite_routes WHERE id = $1 AND user_id = $2;', [
      id,
      userId,
    ]);
    return (res.rowCount ?? 0) > 0;
  }
}

export const savedDataRepository = new SavedDataRepository();
