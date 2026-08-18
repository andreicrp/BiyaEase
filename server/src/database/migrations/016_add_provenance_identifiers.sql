-- Migration 016: Add Provenance and External Identifiers
-- Allows tracking data lineage back to original GTFS feeds and prevents duplicates

-- 1. agencies
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(64) REFERENCES transit_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_agencies_external_id ON agencies(external_id);
CREATE INDEX IF NOT EXISTS idx_agencies_dataset_id ON agencies(dataset_id);

-- 2. routes
ALTER TABLE routes 
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(64) REFERENCES transit_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_routes_external_id ON routes(external_id);
CREATE INDEX IF NOT EXISTS idx_routes_dataset_id ON routes(dataset_id);

-- 3. route_variants
ALTER TABLE route_variants 
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_route_variants_dataset_id ON route_variants(dataset_id);

-- 4. stops
ALTER TABLE stops 
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(64) REFERENCES transit_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_stops_external_id ON stops(external_id);
CREATE INDEX IF NOT EXISTS idx_stops_dataset_id ON stops(dataset_id);

-- 5. trips
ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_trips_external_id ON trips(external_id);
CREATE INDEX IF NOT EXISTS idx_trips_dataset_id ON trips(dataset_id);

-- 6. shapes
ALTER TABLE shapes 
  ADD COLUMN IF NOT EXISTS dataset_id VARCHAR(64) REFERENCES transit_datasets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_shapes_dataset_id ON shapes(dataset_id);
