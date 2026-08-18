-- Migration 003: Create Transit Modes Table
-- Represents transport types (jeepney, bus, mrt, lrt, uv_express, tricycle, walking)

CREATE TABLE IF NOT EXISTS transit_modes (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  icon VARCHAR(64),
  color VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transit_modes_code ON transit_modes(code);
