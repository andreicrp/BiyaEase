-- Migration 012: Create Fares Table
-- Stores transit fare matrices, base fare, minimum fare, and fare types

CREATE TABLE IF NOT EXISTS fares (
  id VARCHAR(64) PRIMARY KEY,
  route_id VARCHAR(64) REFERENCES routes(id) ON DELETE CASCADE,
  mode_id VARCHAR(64) NOT NULL REFERENCES transit_modes(id) ON DELETE RESTRICT,
  base_fare NUMERIC(8, 2) NOT NULL,
  minimum_fare NUMERIC(8, 2) NOT NULL,
  per_km_rate NUMERIC(8, 2) DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
  fare_type VARCHAR(32) NOT NULL DEFAULT 'regular',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  source VARCHAR(64) NOT NULL DEFAULT 'ltfrb',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fares_route_id ON fares(route_id);
CREATE INDEX IF NOT EXISTS idx_fares_mode_id ON fares(mode_id);
CREATE INDEX IF NOT EXISTS idx_fares_fare_type ON fares(fare_type);
