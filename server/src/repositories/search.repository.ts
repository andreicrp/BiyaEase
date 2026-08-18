import { query } from '../database/index.js';

export interface RawSearchEntity {
  id: string;
  entity_type: 'place' | 'stop' | 'station' | 'route';
  name: string;
  subtitle: string;
  category: string | null;
  mode: string | null;
  mode_color: string | null;
  route_code: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number | null;
  relevance_score: number;
}

export interface SearchOptions {
  queryText: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  limit?: number;
}

export class SearchRepository {
  /**
   * Execute a multi-entity ranked search across places, stops, and routes.
   * Leverages pg_trgm similarity, ILIKE prefix/substring matching, token heuristics, and PostGIS ST_Distance.
   */
  async searchAll(options: SearchOptions): Promise<RawSearchEntity[]> {
    const { queryText, lat, lng, radiusMeters, limit = 20 } = options;
    const trimmed = queryText.trim();
    const hasLocation = lat !== undefined && lng !== undefined;

    // Cleaned search token (e.g., "Route 05" -> extract "05")
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');

    // Parameter values for SQL prepared statement
    const params: (string | number)[] = [
      trimmed, // $1: exact query
      `${trimmed}%`, // $2: prefix match
      `%${trimmed}%`, // $3: substring match
      cleanDigits ? `%${cleanDigits}%` : `%${trimmed}%`, // $4: digit/token match
      limit, // $5: limit
    ];

    let distanceExpr = 'NULL::DOUBLE PRECISION AS distance_meters';
    let distanceWherePlaces = '';
    let distanceWhereStops = '';

    if (hasLocation) {
      params.push(lat, lng);
      const latIdx = params.length - 1;
      const lngIdx = params.length;

      distanceExpr = `ROUND(ST_Distance(location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography)::numeric, 1) AS distance_meters`;

      if (radiusMeters) {
        params.push(radiusMeters);
        const radiusIdx = params.length;
        distanceWherePlaces = `AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography, $${radiusIdx})`;
        distanceWhereStops = `AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography, $${radiusIdx})`;
      }
    }

    const sql = `
      WITH ranked_places AS (
        SELECT
          CONCAT('place:', id) AS id,
          'place'::text AS entity_type,
          name,
          CONCAT(UPPER(SUBSTRING(category, 1, 1)), SUBSTRING(category, 2), CASE WHEN address IS NOT NULL THEN CONCAT(' · ', address) ELSE '' END) AS subtitle,
          category,
          NULL::text AS mode,
          NULL::text AS mode_color,
          NULL::text AS route_code,
          latitude,
          longitude,
          ${distanceExpr.replace('location', 'location')},
          (
            CASE 
              WHEN LOWER(name) = LOWER($1) THEN 100.0
              WHEN name ILIKE $2 THEN 80.0
              WHEN name ILIKE $3 THEN 55.0
              WHEN (LOWER($1) = 'up' AND (name ILIKE '%University of the Philippines%' OR name ILIKE '%UP%')) THEN 95.0
              WHEN category ILIKE $2 THEN 40.0
              WHEN address ILIKE $3 THEN 30.0
              ELSE similarity(name, $1) * 35.0
            END
          ) AS relevance_score
        FROM places
        WHERE is_active = true
          AND (
            name ILIKE $3 
            OR address ILIKE $3 
            OR category ILIKE $3
            OR (LOWER($1) = 'up' AND name ILIKE '%University of the Philippines%')
            OR similarity(name, $1) > 0.2
          )
          ${distanceWherePlaces}
      ),
      ranked_stops AS (
        SELECT
          CONCAT('stop:', s.id) AS id,
          (
            CASE 
              WHEN m.code IN ('mrt', 'lrt') THEN 'station'
              ELSE 'stop'
            END
          )::text AS entity_type,
          s.name,
          COALESCE(s.description, s.address, CONCAT(COALESCE(m.name, 'Transit'), ' Stop')) AS subtitle,
          'transit_stop'::text AS category,
          m.code AS mode,
          m.color AS mode_color,
          s.code AS route_code,
          s.latitude,
          s.longitude,
          ${distanceExpr.replace('location', 's.location')},
          (
            CASE 
              WHEN LOWER(s.name) = LOWER($1) THEN 95.0
              WHEN s.code ILIKE $1 THEN 90.0
              WHEN s.name ILIKE $2 THEN 70.0
              WHEN s.name ILIKE $3 THEN 45.0
              WHEN m.code ILIKE $1 OR m.name ILIKE $1 THEN 40.0
              ELSE similarity(s.name, $1) * 30.0
            END
          ) AS relevance_score
        FROM stops s
        LEFT JOIN (
          SELECT DISTINCT ON (st.stop_id) st.stop_id, tm.code, tm.name, tm.color
          FROM stop_times st
          JOIN trips t ON t.id = st.trip_id
          JOIN route_variants rv ON rv.id = t.route_variant_id
          JOIN routes r ON r.id = rv.route_id
          JOIN transit_modes tm ON tm.id = r.mode_id
        ) m ON m.stop_id = s.id
        WHERE s.is_active = true
          AND (
            s.name ILIKE $3 
            OR s.code ILIKE $3
            OR similarity(s.name, $1) > 0.2
          )
          ${distanceWhereStops}
      ),
      ranked_routes AS (
        SELECT
          CONCAT('route:', r.id) AS id,
          'route'::text AS entity_type,
          CONCAT(r.code, ': ', r.name) AS name,
          COALESCE(r.description, CONCAT(tm.name, ' Transit Corridor')) AS subtitle,
          'route'::text AS category,
          tm.code AS mode,
          r.route_color AS mode_color,
          r.code AS route_code,
          COALESCE(rep.latitude, 14.6538) AS latitude,
          COALESCE(rep.longitude, 121.0685) AS longitude,
          NULL::DOUBLE PRECISION AS distance_meters,
          (
            CASE 
              WHEN LOWER(r.code) = LOWER($1) THEN 100.0
              WHEN LOWER(r.name) = LOWER($1) THEN 90.0
              WHEN r.code ILIKE $2 THEN 80.0
              WHEN r.name ILIKE $2 THEN 65.0
              WHEN r.name ILIKE $3 OR r.code ILIKE $3 THEN 50.0
              WHEN r.code ILIKE $4 OR r.name ILIKE $4 THEN 45.0
              ELSE similarity(r.name, $1) * 25.0
            END
          ) AS relevance_score
        FROM routes r
        JOIN transit_modes tm ON tm.id = r.mode_id
        LEFT JOIN (
          SELECT DISTINCT ON (rv.route_id) rv.route_id, s.latitude, s.longitude
          FROM route_variants rv
          JOIN trips t ON t.route_variant_id = rv.id
          JOIN stop_times st ON st.trip_id = t.id
          JOIN stops s ON s.id = st.stop_id
          ORDER BY rv.route_id, st.stop_sequence ASC
        ) rep ON rep.route_id = r.id
        WHERE r.is_active = true
          AND (
            r.name ILIKE $3 
            OR r.code ILIKE $3
            OR r.code ILIKE $4
            OR tm.name ILIKE $3
            OR similarity(r.name, $1) > 0.2
          )
      )
      SELECT * FROM (
        SELECT * FROM ranked_places
        UNION ALL
        SELECT * FROM ranked_stops
        UNION ALL
        SELECT * FROM ranked_routes
      ) combined
      ORDER BY 
        relevance_score DESC,
        CASE WHEN distance_meters IS NOT NULL THEN distance_meters ELSE 999999 END ASC,
        name ASC
      LIMIT $5;
    `;

    const result = await query<RawSearchEntity>(sql, params);
    return result.rows;
  }
}

export const searchRepository = new SearchRepository();
