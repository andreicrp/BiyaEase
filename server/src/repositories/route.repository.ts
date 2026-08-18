import { query } from '../database/index.js';

export interface RouteDetail {
  id: string;
  agency_id: string | null;
  agency_name: string | null;
  mode_id: string;
  mode_code: string;
  mode_name: string;
  mode_color: string | null;
  code: string;
  name: string;
  description: string | null;
  route_color: string | null;
  is_active: boolean;
  source: string;
  created_at: Date;
  updated_at: Date;
}

export interface RouteVariantDetail {
  id: string;
  route_id: string;
  name: string;
  direction: string;
  description: string | null;
  is_active: boolean;
}

export interface RouteShapeGeoJSON {
  id: string;
  route_variant_id: string;
  total_distance_meters: number | null;
  geojson: string;
}

export class RouteRepository {
  async findAllActive(): Promise<RouteDetail[]> {
    const sql = `
      SELECT 
        r.id,
        r.agency_id,
        a.name AS agency_name,
        r.mode_id,
        m.code AS mode_code,
        m.name AS mode_name,
        m.color AS mode_color,
        r.code,
        r.name,
        r.description,
        r.route_color,
        r.is_active,
        r.source,
        r.created_at,
        r.updated_at
      FROM routes r
      JOIN transit_modes m ON m.id = r.mode_id
      LEFT JOIN agencies a ON a.id = r.agency_id
      WHERE r.is_active = true
      ORDER BY m.code ASC, r.code ASC;
    `;

    const result = await query<RouteDetail>(sql);
    return result.rows;
  }

  async findById(id: string): Promise<RouteDetail | null> {
    const sql = `
      SELECT 
        r.id,
        r.agency_id,
        a.name AS agency_name,
        r.mode_id,
        m.code AS mode_code,
        m.name AS mode_name,
        m.color AS mode_color,
        r.code,
        r.name,
        r.description,
        r.route_color,
        r.is_active,
        r.source,
        r.created_at,
        r.updated_at
      FROM routes r
      JOIN transit_modes m ON m.id = r.mode_id
      LEFT JOIN agencies a ON a.id = r.agency_id
      WHERE r.id = $1;
    `;

    const result = await query<RouteDetail>(sql, [id]);
    return result.rows[0] ?? null;
  }

  async findVariants(routeId: string): Promise<RouteVariantDetail[]> {
    const sql = `
      SELECT id, route_id, name, direction, description, is_active
      FROM route_variants
      WHERE route_id = $1 AND is_active = true
      ORDER BY direction ASC;
    `;

    const result = await query<RouteVariantDetail>(sql, [routeId]);
    return result.rows;
  }

  /**
   * Retrieve GeoJSON LineString geometry of route variant path
   */
  async findShapeGeoJson(routeVariantId: string): Promise<RouteShapeGeoJSON | null> {
    const sql = `
      SELECT 
        id, 
        route_variant_id, 
        total_distance_meters,
        ST_AsGeoJSON(shape) AS geojson
      FROM shapes
      WHERE route_variant_id = $1;
    `;

    const result = await query<RouteShapeGeoJSON>(sql, [routeVariantId]);
    return result.rows[0] ?? null;
  }
}

export const routeRepository = new RouteRepository();
