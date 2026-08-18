import { query } from '../database/index.js';

export interface TransitStop {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  source: string;
  created_at: Date;
  updated_at: Date;
  distance_meters?: number;
}

export class StopRepository {
  async findAllActive(): Promise<TransitStop[]> {
    const result = await query<TransitStop>(
      'SELECT id, code, name, description, address, latitude, longitude, is_active, source, created_at, updated_at FROM stops WHERE is_active = true ORDER BY name ASC;'
    );
    return result.rows;
  }

  async findById(id: string): Promise<TransitStop | null> {
    const result = await query<TransitStop>(
      'SELECT id, code, name, description, address, latitude, longitude, is_active, source, created_at, updated_at FROM stops WHERE id = $1;',
      [id]
    );
    return result.rows[0] ?? null;
  }

  /**
   * PostGIS spatial search for stops within a radius (meters) of (lat, lng)
   * ST_DWithin performs index-accelerated GIST spatial search on GEOGRAPHY(Point, 4326)
   */
  async findNearby(
    lat: number,
    lng: number,
    radiusMeters: number = 1000,
    limit: number = 20
  ): Promise<TransitStop[]> {
    const sql = `
      SELECT 
        id, 
        code, 
        name, 
        description, 
        address, 
        latitude, 
        longitude, 
        is_active, 
        source, 
        created_at, 
        updated_at,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)::numeric, 1) AS distance_meters
      FROM stops
      WHERE is_active = true
        AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
      ORDER BY distance_meters ASC
      LIMIT $4;
    `;

    const result = await query<TransitStop>(sql, [lat, lng, radiusMeters, limit]);
    return result.rows;
  }

  /**
   * Find stops associated with a specific route variant in sequence order
   */
  async findByRouteVariantId(routeVariantId: string): Promise<TransitStop[]> {
    const sql = `
      SELECT 
        s.id, 
        s.code, 
        s.name, 
        s.description, 
        s.address, 
        s.latitude, 
        s.longitude, 
        s.is_active, 
        s.source,
        st.stop_sequence,
        st.arrival_time,
        st.departure_time
      FROM trips t
      JOIN stop_times st ON st.trip_id = t.id
      JOIN stops s ON s.id = st.stop_id
      WHERE t.route_variant_id = $1 AND t.is_active = true
      ORDER BY st.stop_sequence ASC;
    `;

    const result = await query<TransitStop>(sql, [routeVariantId]);
    return result.rows;
  }
}

export const stopRepository = new StopRepository();
