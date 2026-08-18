# BiyaEase Transit Data Management & GTFS Feed Manager (Phase 14)

## 1. Executive Summary

Phase 14 provides administrative endpoints (`/api/admin/gtfs/*`) and data tools allowing system operators to manage GTFS agencies, create/update transit route definitions, edit stop locations & coordinates, and trigger feed imports directly within Railway PostgreSQL PostGIS storage.

---

## 2. API Endpoints (`requireAuth` + `requireAdmin`)

- `GET /api/admin/gtfs/agencies`: Returns list of active GTFS transit agencies.
- `GET /api/admin/gtfs/routes`: Returns list of GTFS routes with associated stop counts.
- `POST /api/admin/gtfs/routes`: Creates or updates GTFS route entry.
- `DELETE /api/admin/gtfs/routes/:id`: Deletes GTFS route entry.
- `GET /api/admin/gtfs/stops`: Returns list of GTFS stops with latitude/longitude coordinates.
- `POST /api/admin/gtfs/stops`: Creates or updates GTFS stop entry with PostGIS geography point calculations.
- `DELETE /api/admin/gtfs/stops/:id`: Deletes GTFS stop entry.
