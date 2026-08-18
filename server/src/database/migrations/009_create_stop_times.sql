-- Migration 009: Create Stop Times Table
-- Maps to GTFS stop_times.txt for ordered transit stop sequences

CREATE TABLE IF NOT EXISTS stop_times (
  id VARCHAR(64) PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id VARCHAR(64) NOT NULL REFERENCES stops(id) ON DELETE RESTRICT,
  stop_sequence INTEGER NOT NULL CHECK (stop_sequence > 0),
  arrival_time VARCHAR(16),
  departure_time VARCHAR(16),
  pickup_type INTEGER DEFAULT 0,
  drop_off_type INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_trip_stop_sequence UNIQUE (trip_id, stop_sequence)
);

CREATE INDEX IF NOT EXISTS idx_stop_times_trip_id ON stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop_id ON stop_times(stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_trip_sequence ON stop_times(trip_id, stop_sequence);
