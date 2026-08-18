-- Migration 015: Create Transit Datasets Table
-- Manages feed versions, import statuses, SHA-256 hashes, and diagnostics

CREATE TABLE IF NOT EXISTS transit_datasets (
  id VARCHAR(64) PRIMARY KEY,
  source_id VARCHAR(64) NOT NULL REFERENCES transit_sources(id) ON DELETE CASCADE,
  version VARCHAR(64) NOT NULL,
  imported_at TIMESTAMPTZ,
  valid_from DATE,
  valid_until DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  file_hash VARCHAR(128) NOT NULL,
  record_counts JSONB DEFAULT '{}'::jsonb,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  report_url VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transit_datasets_source_id ON transit_datasets(source_id);
CREATE INDEX IF NOT EXISTS idx_transit_datasets_status ON transit_datasets(status);
CREATE INDEX IF NOT EXISTS idx_transit_datasets_hash ON transit_datasets(file_hash);
