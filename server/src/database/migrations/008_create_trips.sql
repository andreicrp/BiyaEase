-- Migration 008: Create Trips Table
-- Maps to GTFS trips.txt

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(64) PRIMARY KEY,
  route_variant_id VARCHAR(64) NOT NULL REFERENCES route_variants(id) ON DELETE CASCADE,
  service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
  code VARCHAR(64),
  headsign VARCHAR(255) NOT NULL,
  direction VARCHAR(32) NOT NULL DEFAULT 'outbound',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trips_route_variant_id ON trips(route_variant_id);
CREATE INDEX IF NOT EXISTS idx_trips_service_id ON trips(service_id);
CREATE INDEX IF NOT EXISTS idx_trips_is_active ON trips(is_active);
