-- Migration 006: Create Route Variants Table
-- Supports directional (Inbound/Outbound) and branch variants of routes

CREATE TABLE IF NOT EXISTS route_variants (
  id VARCHAR(64) PRIMARY KEY,
  route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  direction VARCHAR(32) NOT NULL DEFAULT 'outbound',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_variants_route_id ON route_variants(route_id);
CREATE INDEX IF NOT EXISTS idx_route_variants_is_active ON route_variants(is_active);
