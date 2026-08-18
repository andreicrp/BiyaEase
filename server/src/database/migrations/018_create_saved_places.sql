-- Migration 018: Create saved_places table for local & authenticated saved locations
CREATE TABLE IF NOT EXISTS saved_places (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(128) DEFAULT 'device-local',
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(64) DEFAULT 'favorite',
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    location_type VARCHAR(64) DEFAULT 'place',
    subtitle VARCHAR(255),
    category VARCHAR(64) DEFAULT 'favorite',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_places_device_id ON saved_places(device_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
