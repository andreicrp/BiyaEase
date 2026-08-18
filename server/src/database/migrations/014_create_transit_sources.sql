-- Migration 014: Create Transit Sources Table
-- Registry of transit data providers and provenance metadata

CREATE TABLE IF NOT EXISTS transit_sources (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  source_type VARCHAR(64) NOT NULL DEFAULT 'gtfs',
  url VARCHAR(512),
  description TEXT,
  license VARCHAR(128),
  attribution VARCHAR(512),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transit_sources_type ON transit_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_transit_sources_is_active ON transit_sources(is_active);
