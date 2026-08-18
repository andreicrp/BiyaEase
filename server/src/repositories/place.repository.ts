import { query } from '../database/index.js';

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  source: string;
  external_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  distance_meters?: number;
}

export class PlaceRepository {
  async findAllActive(): Promise<Place[]> {
    const result = await query<Place>(
      'SELECT id, name, category, address, latitude, longitude, source, external_id, is_active, created_at, updated_at FROM places WHERE is_active = true ORDER BY name ASC;'
    );
    return result.rows;
  }

  async findById(id: string): Promise<Place | null> {
    const result = await query<Place>(
      'SELECT id, name, category, address, latitude, longitude, source, external_id, is_active, created_at, updated_at FROM places WHERE id = $1;',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async search(searchTerm: string, limit: number = 20): Promise<Place[]> {
    const sql = `
      SELECT 
        id, 
        name, 
        category, 
        address, 
        latitude, 
        longitude, 
        source, 
        external_id, 
        is_active, 
        created_at, 
        updated_at
      FROM places
      WHERE is_active = true
        AND (name ILIKE $1 OR address ILIKE $1 OR category ILIKE $1)
      ORDER BY name ASC
      LIMIT $2;
    `;

    const result = await query<Place>(sql, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  /**
   * PostGIS spatial search for places within a radius (meters) of (lat, lng)
   */
  async findNearby(
    lat: number,
    lng: number,
    radiusMeters: number = 2000,
    limit: number = 20
  ): Promise<Place[]> {
    const sql = `
      SELECT 
        id, 
        name, 
        category, 
        address, 
        latitude, 
        longitude, 
        source, 
        external_id, 
        is_active, 
        created_at, 
        updated_at,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)::numeric, 1) AS distance_meters
      FROM places
      WHERE is_active = true
        AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
      ORDER BY distance_meters ASC
      LIMIT $4;
    `;

    const result = await query<Place>(sql, [lat, lng, radiusMeters, limit]);
    return result.rows;
  }
}

export const placeRepository = new PlaceRepository();
