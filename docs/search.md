# BiyaEase Location Search & Place Autocomplete Architecture (Phase 5)

This document describes the location search, auto-completion, multi-entity ranking, PostgreSQL trigram indexing, PostGIS proximity queries, and mobile integration for **BiyaEase**.

---

## 1. System Architecture & Data Flow

```
USER TYPES SEARCH QUERY (e.g. "UP", "SM North", "MRT-3", "Philcoa")
    ↓
SEARCH SCREEN (mobile/screens/SearchScreen.tsx)
    ├── 300ms Debounce Timer (cancels stale in-flight typing requests)
    └── Checks Query Length (0 chars: recent searches; 2+ chars: API search)
    ↓
SEARCH API SERVICE (mobile/services/searchApiService.ts)
    ↓
GET /api/search?q={query}&lat={lat}&lng={lng}&radius={radius}&limit={limit}
    ↓
SEARCH CONTROLLER (server/src/controllers/search.controller.ts)
    ├── Validates query length, bounding box latitudes/longitudes, and limits
    ↓
SEARCH SERVICE & REPOSITORY (server/src/repositories/search.repository.ts)
    ├── PostgreSQL pg_trgm GIN Indexes (name gin_trgm_ops)
    ├── Multi-tier Ranking Heuristics (Exact > Prefix > Substring > Fuzzy Trigram)
    └── PostGIS GIST ST_Distance Proximity Calculations
    ↓
NORMALIZED RESPONSE ({ id, type, name, subtitle, latitude, longitude, distanceMeters })
    ↓
MOBILE CATEGORIZED RESULTS
    ├── 🏛️ Places & Landmarks (Malls, Universities, Offices, Landmarks)
    ├── 🚉 Transit Stops & Stations (MRT, LRT, EDSA Busway, PUJ stops)
    └── 🚐 Transit Routes & Corridors (Route corridors)
    ↓
SELECTED DESTINATION (SelectedLocation contract ready for Phase 6 Routing Engine)
```

---

## 2. API Specifications

### Endpoint

`GET /api/search`

### Query Parameters

| Parameter | Type     | Required | Default | Description                                                     |
| --------- | -------- | -------- | ------- | --------------------------------------------------------------- |
| `q`       | `string` | **Yes**  | —       | Search query string (minimum 1 char).                           |
| `lat`     | `number` | Optional | —       | Latitude for proximity distance calculation ($-90$ to $90$).    |
| `lng`     | `number` | Optional | —       | Longitude for proximity distance calculation ($-180$ to $180$). |
| `radius`  | `number` | Optional | —       | Maximum search radius in meters ($1$ to $50,000$).              |
| `limit`   | `number` | Optional | `20`    | Max results returned (capped at $50$).                          |

### Example Request

```http
GET /api/search?q=UP&lat=14.6538&lng=121.0685&limit=10 HTTP/1.1
Host: localhost:5000
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "place:place-up-diliman",
      "type": "place",
      "name": "University of the Philippines Diliman",
      "subtitle": "University · Diliman, Quezon City",
      "latitude": 14.6538,
      "longitude": 121.0685,
      "category": "university",
      "distanceMeters": 0
    },
    {
      "id": "stop:stop-up-oval",
      "type": "stop",
      "name": "UP Diliman Academic Oval",
      "subtitle": "Near Quezon Hall & sunken garden",
      "latitude": 14.6538,
      "longitude": 121.0685,
      "category": "transit_stop",
      "mode": "jeepney",
      "modeColor": "#F59E0B",
      "distanceMeters": 0
    },
    {
      "id": "route:route-jeep-05",
      "type": "route",
      "name": "JEEP-05: UP Campus - Philcoa",
      "subtitle": "Traditional Jeepney via Commonwealth Ave & UP Oval",
      "latitude": 14.6538,
      "longitude": 121.0685,
      "category": "route",
      "mode": "jeepney",
      "modeColor": "#F59E0B"
    }
  ],
  "total": 3
}
```

---

## 3. Search Ranking Heuristics

The search engine implements a multi-tier relevance scoring function combining SQL pattern matching and trigram similarity:

| Tier                         | Condition                                                            | Score Weight            |
| ---------------------------- | -------------------------------------------------------------------- | ----------------------- |
| **Tier 1 (Exact Match)**     | `LOWER(name) = LOWER(query)` or `code = query`                       | **100.0**               |
| **Tier 2 (Prefix Match)**    | `name ILIKE 'query%'` or `code ILIKE 'query%'`                       | **70.0 - 80.0**         |
| **Tier 3 (Substring Match)** | `name ILIKE '%query%'` or `address ILIKE '%query%'`                  | **45.0 - 55.0**         |
| **Tier 4 (Trigram Fuzzy)**   | `similarity(name, query) > 0.20`                                     | **`similarity * 35.0`** |
| **Proximity Modifier**       | When `lat` / `lng` provided: Secondary sort on `distance_meters ASC` | **Distance Bias**       |

---

## 4. Database Indexing (`017_enable_trgm_and_search_indexes.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_places_name_trgm ON places USING GIN (name gin_trgm_ops);
CREATE INDEX idx_places_address_trgm ON places USING GIN (address gin_trgm_ops);
CREATE INDEX idx_stops_name_trgm ON stops USING GIN (name gin_trgm_ops);
CREATE INDEX idx_routes_name_trgm ON routes USING GIN (name gin_trgm_ops);
CREATE INDEX idx_routes_code_trgm ON routes USING GIN (code gin_trgm_ops);
```

---

## 5. Phase 6 Routing Compatibility Contract

The output of search result selection maps directly to `SelectedLocation`:

```typescript
export interface SelectedLocation {
  id: string;
  name: string;
  type: 'place' | 'stop' | 'station' | 'route';
  latitude: number;
  longitude: number;
  subtitle?: string;
  mode?: string;
  category?: string;
}
```

This guarantees Phase 6 can directly consume `origin: { latitude, longitude }` and `destination: { latitude, longitude }` without rewriting the search engine.
