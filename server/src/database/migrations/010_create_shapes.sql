-- Migration 010: Create Shapes Table
-- Represents the geographic LineString path of a transit corridor
-- shape: GEOMETRY(LineString, 4326)

CREATE TABLE IF NOT EXISTS shapes (
  id VARCHAR(64) PRIMARY KEY,
  route_variant_id VARCHAR(64) NOT NULL REFERENCES route_variants(id) ON DELETE CASCADE,
  shape GEOMETRY(LineString, 4326) NOT NULL,
  total_distance_meters DOUBLE PRECISION,
  source VARCHAR(64) NOT NULL DEFAULT 'biyaease',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shapes_route_variant_id ON shapes(route_variant_id);
