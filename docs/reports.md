# BiyaEase Community Crowd Reports Architecture (Phase 12)

## 1. Executive Summary

Phase 12 introduces real-time, crowdsourced transit incident reports submitted by Filipino commuters (e.g. Heavy Traffic, Station Crowded, Vehicle Full, Trip Delay, Road Blocked, Fare Changed). Active reports are stored in Railway PostgreSQL using PostGIS geography points, queried using spatial proximity algorithms (`ST_DWithin`), and rendered on interactive map tiles.

---

## 2. Architecture & Data Flow

```
[ Commuter Mobile App ]
  ├── View Nearby Reports ────> GET /api/reports/nearby?lat=...&lng=...&radius=5000
  ├── Submit New Report ──────> POST /api/reports (Requires Auth)
  └── Confirm Incident ───────> POST /api/reports/:id/confirm (Requires Auth)
                                           │
                                           ▼
                                [ Express Backend API ]
                                           │
                                           ▼
                                [ PostgreSQL + PostGIS ]
                                ├── community_reports table (Geography Point)
                                └── report_confirmations table (Unique FK constraint)
```

---

## 3. Database Schema

### `community_reports`

```sql
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    confirmed_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### `report_confirmations`

```sql
CREATE TABLE IF NOT EXISTS report_confirmations (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_report_user_confirmation UNIQUE (report_id, user_id)
);
```

---

## 4. PostGIS Spatial Queries

### Proximity Search (`ST_DWithin` & `ST_Distance`)

```sql
SELECT r.id, r.type, r.title, r.confirmed_count,
       ROUND(ST_Distance(r.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 1) AS distance_meters
FROM community_reports r
WHERE r.status = 'active'
  AND r.expires_at > CURRENT_TIMESTAMP
  AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
ORDER BY distance_meters ASC, r.created_at DESC;
```

---

## 5. API Endpoints

- `GET /api/reports/nearby`: Public endpoint returning active reports within specified radius.
- `GET /api/reports/:id`: Public endpoint retrieving report details.
- `POST /api/reports`: Protected endpoint for publishing crowd incident reports.
- `POST /api/reports/:id/confirm`: Protected endpoint incrementing confirmation count (prevents duplicate confirmations).
- `POST /api/reports/:id/dismiss`: Protected moderation endpoint.
- `DELETE /api/reports/:id`: Protected endpoint for author report deletion.

---

## 6. Mobile UI Components

- **`ReportTypeSelector.tsx`**: Category grid (🚨 Heavy Traffic, 👥 Station Crowded, 🚐 Vehicle Full, ⏳ Trip Delay, 🛑 Road Blocked, 💸 Fare Changed, 🚏 Stop Moved, 📢 Other Alert).
- **`ReportCard.tsx`**: Incident card displaying category badge, distance away, time ago, and 1-tap confirmation button.
- **`ReportIssueScreen.tsx`**: Report creation screen with duration auto-expiration chips (1h, 2h, 4h, 8h).
