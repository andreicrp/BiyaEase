-- Migration 011: Create Places Table
-- Searchable landmarks, universities, malls, terminals, and key destinations
-- location: GEOGRAPHY(Point, 4326)

CREATE TABLE IF NOT EXISTS places (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'landmark',
  address VARCHAR(512),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  source VARCHAR(64) NOT NULL DEFAULT 'biyaease',
  external_id VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_is_active ON places(is_active);
CREATE INDEX IF NOT EXISTS idx_places_external_id ON places(external_id);
