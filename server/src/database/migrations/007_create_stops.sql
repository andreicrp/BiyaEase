-- Migration 007: Create Transit Stops Table
-- Maps to GTFS stops.txt and physical PUV boarding points
-- location: GEOGRAPHY(Point, 4326)

CREATE TABLE IF NOT EXISTS stops (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(512),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source VARCHAR(64) NOT NULL DEFAULT 'biyaease',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stops_code ON stops(code);
CREATE INDEX IF NOT EXISTS idx_stops_is_active ON stops(is_active);
CREATE INDEX IF NOT EXISTS idx_stops_name ON stops(name);
