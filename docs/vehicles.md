# BiyaEase Real-Time Vehicle Position & Telemetry Architecture (Phase 15)

## 1. Executive Summary

Phase 15 introduces live vehicle position tracking (Jeepney 🚐, Bus 🚌, Rail 🚆), GPS telemetry ingestion (`POST /api/transit/vehicles/update`), and spatial radar search (`GET /api/transit/vehicles/nearby`) powered by PostgreSQL PostGIS spatial geography points (`ST_DWithin` & `ST_Distance`).

---

## 2. Architecture & Data Flow

```
[ Transit GPS Telemetry Provider / Vehicle App ]
                       │
                       ▼
            POST /api/transit/vehicles/update (GPS Coordinates, Bearing, Speed)
                       │
                       ▼
            [ PostgreSQL + PostGIS ]
            └── vehicle_positions table (Geography Point 4326)
                       │
                       ▼
            GET /api/transit/vehicles/nearby?lat=...&lng=...&radius=5000
                       │
                       ▼
            [ Mobile Commuter App (MapView) ]
```

---

## 3. Database Schema Migration (`023_create_vehicle_positions.sql`)

```sql
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
```

---

## 4. API Endpoints

- `POST /api/transit/vehicles/update`: Updates or inserts real-time GPS telemetry (vehicleId, latitude, longitude, bearing, speed, tripId, routeId).
- `GET /api/transit/vehicles/nearby`: Performs spatial radius query returning active moving vehicles updated within the past 15 minutes.
