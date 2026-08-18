-- Migration 005: Create Routes Table
-- Maps to GTFS routes.txt and BiyaEase-managed routes

CREATE TABLE IF NOT EXISTS routes (
  id VARCHAR(64) PRIMARY KEY,
  agency_id VARCHAR(64) REFERENCES agencies(id) ON DELETE SET NULL,
  mode_id VARCHAR(64) NOT NULL REFERENCES transit_modes(id) ON DELETE RESTRICT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  route_color VARCHAR(32) DEFAULT '#0F766E',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source VARCHAR(64) NOT NULL DEFAULT 'biyaease',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routes_agency_id ON routes(agency_id);
CREATE INDEX IF NOT EXISTS idx_routes_mode_id ON routes(mode_id);
CREATE INDEX IF NOT EXISTS idx_routes_code ON routes(code);
CREATE INDEX IF NOT EXISTS idx_routes_is_active ON routes(is_active);
