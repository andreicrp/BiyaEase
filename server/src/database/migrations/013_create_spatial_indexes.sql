-- Migration 013: Create PostGIS GIST Spatial Indexes
-- Accelerates ST_DWithin, ST_Distance, and spatial intersection queries

CREATE INDEX IF NOT EXISTS idx_stops_location_gist ON stops USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_places_location_gist ON places USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_shapes_shape_gist ON shapes USING GIST (shape);
