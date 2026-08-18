-- Migration 023: Create vehicle_positions table for real-time tracking
CREATE TABLE IF NOT EXISTS vehicle_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id VARCHAR(128) NOT NULL UNIQUE,
    trip_id VARCHAR(255) REFERENCES trips(id) ON DELETE SET NULL,
    route_id VARCHAR(255) REFERENCES routes(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    bearing NUMERIC(5, 2),
    speed NUMERIC(5, 2),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_positions_location ON vehicle_positions USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_route ON vehicle_positions(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_updated_at ON vehicle_positions(updated_at);
