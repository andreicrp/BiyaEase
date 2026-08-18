# BiyaEase GTFS & Real Transit Data Ingestion Pipeline

This document defines the ingestion architecture, file mapping, validation rules, normalization layer, and execution workflows for **BiyaEase** — the Philippine commute navigation system.

---

## 1. Pipeline Architecture

```
SOURCE (GTFS / Philippine Transport Feeds)
  ↓
RAW STAGING (server/data/raw/)
  ↓
PARSER (Streaming RFC 4180 CSV with BOM handling)
  ↓
VALIDATOR (File existence, fields, coordinates, relational integrity)
  ↓
NORMALIZER (Mode mapping, clean strings, direction normalization)
  ↓
IMPORTER (Transaction-safe batch insertion & SHA-256 deduplication)
  ↓
POSTGRESQL + POSTGIS (SRID 4326 Point Geography & LineString Geometry)
  ↓
BIYAEASE REST APIs & REPOSITORIES
```

---

## 2. Supported GTFS Specification Files

| GTFS File             | BiyaEase Target Table      | Required / Optional | Purpose                                                    |
| --------------------- | -------------------------- | ------------------- | ---------------------------------------------------------- |
| `agency.txt`          | `agencies`                 | **Required**        | Operators (LTFRB, MRTC, LRMC, MMDA, UP Coop).              |
| `routes.txt`          | `routes`                   | **Required**        | Transit lines with modes and route colors.                 |
| `stops.txt`           | `stops`                    | **Required**        | Boarding points mapped to `GEOGRAPHY(Point, 4326)`.        |
| `trips.txt`           | `trips` & `route_variants` | **Required**        | Directional scheduled operating trips.                     |
| `stop_times.txt`      | `stop_times`               | **Required**        | Sequenced stop connections (`stop_sequence > 0`).          |
| `calendar.txt`        | `services`                 | Optional            | Days of week operating calendar schedules.                 |
| `shapes.txt`          | `shapes`                   | Optional            | Reconstructed `GEOMETRY(LineString, 4326)` corridor lines. |
| `fare_attributes.txt` | `fares`                    | Optional            | Tariffs and per-km pricing in Philippine Pesos (₱).        |

---

## 3. Philippine Transit Mode Mapping

Standard GTFS `route_type` codes are automatically mapped to BiyaEase modes with support for Philippine transit heuristics and custom feed mapping configurations:

| Input Heuristic / GTFS Type | Mapped Transit Mode          | Visual Color        | Mode ID         |
| --------------------------- | ---------------------------- | ------------------- | --------------- |
| `715` / `JEEP` / `JEEPNEY`  | **Jeepney**                  | `#F59E0B` (Amber)   | `mode-jeepney`  |
| `3` / `BUS` / `CITY_BUS`    | **City Bus / EDSA Carousel** | `#2563EB` (Blue)    | `mode-bus`      |
| `1` / `MRT` / `SUBWAY`      | **MRT Rail Line**            | `#7C3AED` (Purple)  | `mode-mrt`      |
| `0` / `LRT` / `TRAM`        | **LRT Rail Line**            | `#DB2777` (Pink)    | `mode-lrt`      |
| `UV` / `UV_EXPRESS`         | **UV Express Van**           | `#0F766E` (Teal)    | `mode-uv`       |
| `TRIKE` / `TRICYCLE`        | **Tricycle**                 | `#10B981` (Emerald) | `mode-tricycle` |
| `WALKING` / Pedestrian      | **Walking**                  | `#64748B` (Slate)   | `mode-walking`  |

---

## 4. Validation Rules

1. **Agencies**: `agency_name` required, valid URL format if provided.
2. **Routes**: `route_id` required, at least one of `route_short_name` or `route_long_name`, valid `route_type`.
3. **Stops**: `stop_id` required, `stop_name` required, Latitude between `-90` and `90`, Longitude between `-180` and `180`. Warning generated if outside Philippine bounds (4°-22° N, 116°-127° E).
4. **Trips & Stop Times**: Valid `route_id` and `stop_id` foreign references, positive sequence (`stop_sequence > 0`), monotonic ordering, duplicate sequence prevention (`UNIQUE(trip_id, stop_sequence)`).
5. **Shapes**: Valid coordinates, positive sequence ordering, minimum 2 points required to construct LineString geometry.

---

## 5. Provenance & Versioning

- Every feed ingestion creates a `transit_sources` record (registry of providers) and a `transit_datasets` record (version and SHA-256 hash).
- All inserted entities store:
  - `source_id`: Originating source provider.
  - `dataset_id`: Specific feed version.
  - `external_id`: Original GTFS ID (e.g. `STOP_10293`) preserving data lineage for re-imports and delta updates.
- **Duplicate Prevention**: If a dataset's SHA-256 hash matches an already imported version, the importer skips redundant database writes unless explicitly forced with `--force`.
- **Rollback Mechanics**: The entire feed ingestion runs inside a single PostgreSQL transaction (`BEGIN; ... COMMIT;`). Any unhandled error triggers an immediate `ROLLBACK;` and generates a diagnostic report in `server/data/reports/`.

---

## 6. CLI Commands

| Command                 | Purpose                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `npm run gtfs:validate` | Validates local GTFS feed directory and outputs record counts, errors, and warnings.         |
| `npm run gtfs:import`   | Validates, normalizes, and transactionally imports a GTFS feed into PostgreSQL/PostGIS.      |
| `npm run gtfs:report`   | Displays the latest generated markdown diagnostic report.                                    |
| `npm run gtfs:test`     | Runs the automated GTFS test suite (parser, validators, mode mapper, and synthetic fixture). |

---

## 7. Synthetic Development Fixture

Located at `server/data/raw/fixtures/sample-philippines/`:

- **Agencies**: DOTr, MMDA, UP Transport Cooperative.
- **Routes**: Route 05 (Jeepney), MRT-3 (Rail), EDSA Busway Carousel (Bus).
- **Stops**: 8 verified Metro Manila coordinate points (Academic Oval, Vinzons Hall, Philcoa, North Ave, Quezon Ave, Cubao, Taft Ave, SM North Busway).
- **Shapes & Trips**: Directional routes with LineString geometries.
