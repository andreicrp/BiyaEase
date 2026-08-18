-- Migration 002: Create Transit Agencies Table
-- Maps to GTFS agency.txt

CREATE TABLE IF NOT EXISTS agencies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE,
  description TEXT,
  website VARCHAR(512),
  phone VARCHAR(64),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(code);
