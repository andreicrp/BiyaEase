-- Migration 019: Create favorite_routes table for local & authenticated commute templates
CREATE TABLE IF NOT EXISTS favorite_routes (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(128) DEFAULT 'device-local',
    user_id UUID,
    display_name VARCHAR(255) NOT NULL,
    origin JSONB NOT NULL,
    destination JSONB NOT NULL,
    journey_reference JSONB,
    mode_summary TEXT[],
    estimated_duration_minutes INTEGER,
    estimated_fare NUMERIC(8, 2),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_favorite_routes_device_id ON favorite_routes(device_id);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_id ON favorite_routes(user_id);
