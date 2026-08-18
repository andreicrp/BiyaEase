import { query } from '../database/index.js';
import { TransitStopNode, TransitEdge, JourneyMode } from '../routing/graph.types.js';
import { calculateTimeDifferenceSeconds } from '../routing/timeCalculator.js';
import { calculateSegmentFare } from '../routing/fareCalculator.js';

export interface NearbyCandidateStop {
  stop: TransitStopNode;
  distanceMeters: number;
}

export class RoutingRepository {
  /**
   * Find candidate transit stops within radius of coordinate using PostGIS spatial indexing.
   */
  async findNearbyStops(
    lat: number,
    lng: number,
    radiusMeters: number = 1000
  ): Promise<NearbyCandidateStop[]> {
    const sql = `
      SELECT 
        id, 
        code, 
        name, 
        latitude, 
        longitude,
        ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)::numeric, 1) AS distance_meters
      FROM stops
      WHERE is_active = true
        AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
      ORDER BY distance_meters ASC
      LIMIT 15;
    `;

    const result = await query<{
      id: string;
      code: string | null;
      name: string;
      latitude: number;
      longitude: number;
      distance_meters: number;
    }>(sql, [lat, lng, radiusMeters]);

    return result.rows.map((row) => ({
      stop: {
        id: row.id,
        code: row.code,
        name: row.name,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      distanceMeters: Number(row.distance_meters),
    }));
  }

  /**
   * Find inter-stop walking transfer edges between all active stops within maxTransferMeters (e.g. 400m).
   */
  async findTransferPairs(maxTransferMeters: number = 400): Promise<
    {
      fromStopId: string;
      toStopId: string;
      distanceMeters: number;
    }[]
  > {
    const sql = `
      SELECT 
        s1.id AS from_stop_id,
        s2.id AS to_stop_id,
        ROUND(ST_Distance(s1.location, s2.location)::numeric, 1) AS distance_meters
      FROM stops s1
      JOIN stops s2 ON s1.id != s2.id AND s1.is_active = true AND s2.is_active = true
      WHERE ST_DWithin(s1.location, s2.location, $1)
      ORDER BY distance_meters ASC;
    `;

    const result = await query<{
      from_stop_id: string;
      to_stop_id: string;
      distance_meters: number;
    }>(sql, [maxTransferMeters]);

    return result.rows.map((r) => ({
      fromStopId: r.from_stop_id,
      toStopId: r.to_stop_id,
      distanceMeters: Number(r.distance_meters),
    }));
  }

  /**
   * Load the transit network graph from the database (consecutive stop times along trips, routes, fares, and shapes).
   */
  async getTransitNetworkEdges(): Promise<{
    stops: Map<string, TransitStopNode>;
    edges: TransitEdge[];
  }> {
    // 1. Fetch all active stops
    const stopsSql = `SELECT id, code, name, latitude, longitude FROM stops WHERE is_active = true;`;
    const stopsRes = await query<{
      id: string;
      code: string | null;
      name: string;
      latitude: number;
      longitude: number;
    }>(stopsSql);

    const stopsMap = new Map<string, TransitStopNode>();
    for (const row of stopsRes.rows) {
      stopsMap.set(row.id, {
        id: row.id,
        code: row.code,
        name: row.name,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      });
    }

    // 2. Fetch all consecutive stop pairs along scheduled trips
    const edgesSql = `
      SELECT 
        st1.stop_id AS from_stop_id,
        st2.stop_id AS to_stop_id,
        t.id AS trip_id,
        r.id AS route_id,
        r.name AS route_name,
        r.code AS route_code,
        rv.id AS route_variant_id,
        tm.code AS mode_code,
        COALESCE(r.route_color, tm.color, '#0F766E') AS mode_color,
        st1.stop_sequence AS from_seq,
        st2.stop_sequence AS to_seq,
        st1.departure_time,
        st2.arrival_time,
        f.base_fare,
        f.minimum_fare,
        f.per_km_rate,
        f.currency,
        ST_AsGeoJSON(sh.shape) AS shape_geojson,
        ROUND(ST_Distance(s1.location, s2.location)::numeric, 1) AS straight_distance_meters
      FROM stop_times st1
      JOIN stop_times st2 ON st1.trip_id = st2.trip_id AND st2.stop_sequence = st1.stop_sequence + 1
      JOIN trips t ON t.id = st1.trip_id AND t.is_active = true
      JOIN route_variants rv ON rv.id = t.route_variant_id AND rv.is_active = true
      JOIN routes r ON r.id = rv.route_id AND r.is_active = true
      JOIN transit_modes tm ON tm.id = r.mode_id
      JOIN stops s1 ON s1.id = st1.stop_id
      JOIN stops s2 ON s2.id = st2.stop_id
      LEFT JOIN fares f ON f.route_id = r.id
      LEFT JOIN shapes sh ON sh.route_variant_id = rv.id
      ORDER BY r.code, t.id, st1.stop_sequence;
    `;

    const edgesRes = await query<{
      from_stop_id: string;
      to_stop_id: string;
      trip_id: string;
      route_id: string;
      route_name: string;
      route_code: string;
      route_variant_id: string;
      mode_code: string;
      mode_color: string;
      from_seq: number;
      to_seq: number;
      departure_time: string;
      arrival_time: string;
      base_fare: number | null;
      minimum_fare: number | null;
      per_km_rate: number | null;
      currency: string | null;
      shape_geojson: string | null;
      straight_distance_meters: number;
    }>(edgesSql);

    const edges: TransitEdge[] = [];

    for (const r of edgesRes.rows) {
      const mode = (r.mode_code as JourneyMode) || 'bus';
      const durationSeconds = calculateTimeDifferenceSeconds(r.departure_time, r.arrival_time);
      const distanceMeters = Number(r.straight_distance_meters) || 800;

      const fareRule =
        r.base_fare !== null
          ? {
              routeId: r.route_id,
              modeId: r.mode_code,
              baseFare: Number(r.base_fare),
              minimumFare: Number(r.minimum_fare),
              perKmRate: Number(r.per_km_rate),
              currency: r.currency || 'PHP',
            }
          : undefined;

      const fare = calculateSegmentFare(mode, distanceMeters, fareRule);

      let shapeCoordinates: [number, number][] | undefined;
      if (r.shape_geojson) {
        try {
          const parsed = JSON.parse(r.shape_geojson);
          if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
            shapeCoordinates = parsed.coordinates;
          }
        } catch {
          // Ignored
        }
      }

      edges.push({
        fromStopId: r.from_stop_id,
        toStopId: r.to_stop_id,
        tripId: r.trip_id,
        routeId: r.route_id,
        routeName: r.route_name,
        routeCode: r.route_code,
        routeVariantId: r.route_variant_id,
        mode,
        modeColor: r.mode_color,
        fromSequence: r.from_seq,
        toSequence: r.to_seq,
        departureTime: r.departure_time,
        arrivalTime: r.arrival_time,
        durationSeconds,
        distanceMeters,
        fare,
        shapeCoordinates,
      });
    }

    return {
      stops: stopsMap,
      edges,
    };
  }

  /**
   * Directly queries live GTFS transit routes, stops, fares, and geometries from PostgreSQL PostGIS database.
   */
  async findGTFSJourneys(
    origin: { latitude: number; longitude: number; name?: string },
    destination: { latitude: number; longitude: number; name?: string },
    radiusMeters: number = 3000
  ): Promise<any[]> {
    const sql = `
      SELECT DISTINCT ON (r.id)
        r.id AS route_id,
        r.name AS route_name,
        r.code AS route_code,
        tm.code AS mode_code,
        COALESCE(r.route_color, tm.color, '#0F766E') AS mode_color,
        s1.id AS from_stop_id,
        s1.name AS from_stop_name,
        s1.code AS from_stop_code,
        s1.latitude AS from_lat,
        s1.longitude AS from_lng,
        s2.id AS to_stop_id,
        s2.name AS to_stop_name,
        s2.code AS to_stop_code,
        s2.latitude AS to_lat,
        s2.longitude AS to_lng,
        st2.stop_sequence - st1.stop_sequence AS stops_count,
        ROUND(ST_Distance(s1.location, s2.location)::numeric, 1) AS straight_distance_meters,
        COALESCE(f.base_fare, 13) AS fare,
        COALESCE(f.currency, 'PHP') AS currency,
        ST_AsGeoJSON(sh.shape) AS shape_geojson
      FROM stop_times st1
      JOIN stop_times st2 ON st1.trip_id = st2.trip_id AND st2.stop_sequence > st1.stop_sequence
      JOIN trips t ON t.id = st1.trip_id AND t.is_active = true
      JOIN route_variants rv ON rv.id = t.route_variant_id AND rv.is_active = true
      JOIN routes r ON r.id = rv.route_id AND r.is_active = true
      JOIN transit_modes tm ON tm.id = r.mode_id
      JOIN stops s1 ON s1.id = st1.stop_id AND s1.is_active = true
      JOIN stops s2 ON s2.id = st2.stop_id AND s2.is_active = true
      LEFT JOIN fares f ON f.route_id = r.id
      LEFT JOIN shapes sh ON sh.route_variant_id = rv.id
      WHERE ST_DWithin(s1.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $5)
        AND ST_DWithin(s2.location, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $5)
      ORDER BY r.id, straight_distance_meters ASC
      LIMIT 8;
    `;

    const res = await query<any>(sql, [
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
      radiusMeters,
    ]);

    return res.rows;
  }
}

export const routingRepository = new RoutingRepository();
