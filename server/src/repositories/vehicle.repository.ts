import { getDatabasePool } from '../database/index.js';

export interface DbVehiclePosition {
  id: string;
  vehicle_id: string;
  trip_id?: string;
  route_id?: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  updated_at: Date;
  distance_meters?: number;
  route_short_name?: string;
  route_long_name?: string;
}

export class VehicleRepository {
  async upsertVehiclePosition(vehicle: {
    vehicleId: string;
    tripId?: string;
    routeId?: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    speed?: number;
  }): Promise<DbVehiclePosition> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database pool unavailable');

    const res = await pool.query<DbVehiclePosition>(
      `INSERT INTO vehicle_positions (
         vehicle_id, trip_id, route_id, latitude, longitude, bearing, speed, location, updated_at
       )
       VALUES (
         $1, $2, $3, $4::numeric, $5::numeric, $6, $7, ST_SetSRID(ST_MakePoint($5::double precision, $4::double precision), 4326)::geography, CURRENT_TIMESTAMP
       )
       ON CONFLICT (vehicle_id) DO UPDATE SET
         trip_id = EXCLUDED.trip_id,
         route_id = EXCLUDED.route_id,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         bearing = EXCLUDED.bearing,
         speed = EXCLUDED.speed,
         location = EXCLUDED.location,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, vehicle_id, trip_id, route_id, latitude, longitude, bearing, speed, updated_at;`,
      [
        vehicle.vehicleId,
        vehicle.tripId || null,
        vehicle.routeId || null,
        vehicle.latitude,
        vehicle.longitude,
        vehicle.bearing || 0,
        vehicle.speed || 0,
      ]
    );

    const row = res.rows[0]!;
    return {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
  }

  async getNearbyVehicles(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<DbVehiclePosition[]> {
    const pool = getDatabasePool();
    if (!pool) return [];

    const res = await pool.query<DbVehiclePosition>(
      `SELECT vp.id, vp.vehicle_id, vp.trip_id, vp.route_id, vp.latitude, vp.longitude,
              vp.bearing, vp.speed, vp.updated_at,
              r.code AS route_short_name, r.name AS route_long_name,
              ROUND(ST_Distance(vp.location, ST_SetSRID(ST_MakePoint($1::double precision, $2::double precision), 4326)::geography)::numeric, 1) AS distance_meters
       FROM vehicle_positions vp
       LEFT JOIN routes r ON vp.route_id = r.id
       WHERE vp.updated_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
         AND ST_DWithin(vp.location, ST_SetSRID(ST_MakePoint($1::double precision, $2::double precision), 4326)::geography, $3)
       ORDER BY distance_meters ASC;`,
      [longitude, latitude, radiusMeters]
    );

    return res.rows.map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      distance_meters: row.distance_meters ? Number(row.distance_meters) : 0,
    }));
  }

  async deleteStaleVehicles(olderThanMinutes: number = 30): Promise<number> {
    const pool = getDatabasePool();
    if (!pool) return 0;

    const res = await pool.query(
      `DELETE FROM vehicle_positions WHERE updated_at < CURRENT_TIMESTAMP - ($1 || ' minutes')::interval;`,
      [olderThanMinutes]
    );
    return res.rowCount ?? 0;
  }
}

export const vehicleRepository = new VehicleRepository();
