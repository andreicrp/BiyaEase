# BiyaEase Admin Dashboard & Moderation Interface Architecture (Phase 13)

## 1. Executive Summary

Phase 13 introduces a dedicated Web Admin Dashboard in `dashboard/` workspace along with administrative API endpoints (`/api/admin/*`) and security middleware (`requireAdmin`) to allow system administrators to monitor transit ecosystem metrics, moderate crowdsourced community reports, inspect user directory logs, and monitor infrastructure health probes.

---

## 2. Architecture & Data Flow

```
[ Admin Web Dashboard (dashboard/) ]
  ├── View Analytics Metrics ───> GET  /api/admin/metrics (Requires Admin JWT)
  ├── Moderate Crowd Reports ───> GET  /api/admin/reports
  │                              └── POST /api/admin/reports/:id/action (approve|dismiss|delete)
  ├── Inspect User Directory ───> GET  /api/admin/users
  └── Infrastructure Probe ────> GET  /api/health
                                          │
                                          ▼
                               [ Express Backend API ]
                                          │
                                          ▼
                               [ PostgreSQL + PostGIS ]
                               └── users.is_admin column
```

---

## 3. Database Schema Migration (`022_add_admin_flag.sql`)

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
```

---

## 4. API Endpoints & Security

- `GET /api/admin/metrics`: Returns total registered users, active reports, saved places, favorite routes, and GTFS transit stops/routes counts.
- `GET /api/admin/reports`: Lists community reports with status filter (`all`, `active`, `dismissed`).
- `POST /api/admin/reports/:id/action`: Action handler (`approve`, `dismiss`, `delete`).
- `GET /api/admin/users`: Lists registered user accounts with activity stats.
- **Middleware**: `requireAuth` + `requireAdmin` enforcing `req.user.isAdmin === true` or returning `403 Forbidden`.
