# BiyaEase Multi-Modal Routing Engine Architecture (Phase 6)

This document describes the transit graph data structure, multi-criteria Dijkstra pathfinding algorithm, Philippine statutory fare calculations, travel-time computation, GTFS time conversion, transfer mechanics, route ranking, and mobile visualization engine for **BiyaEase**.

---

## 1. System Architecture & Routing Flow

```
USER SELECTS ORIGIN & DESTINATION COORDINATES
    ↓
MOBILE ROUTE OPTIONS SCREEN (mobile/screens/RouteOptionsScreen.tsx)
    ↓
ROUTING API SERVICE (mobile/services/routingApiService.ts)
    ↓
POST /api/routes/search
{ origin: { lat, lng }, destination: { lat, lng }, maxWalkingDistanceMeters, maxTransfers, limit }
    ↓
ROUTING CONTROLLER (server/src/controllers/routing.controller.ts)
    ├── Validates lat (-90 to 90), lng (-180 to 180), maxWalk (100 to 3000m), maxTransfers (0 to 3)
    ↓
ROUTING SERVICE (server/src/services/routing.service.ts)
    ↓
TRANSIT GRAPH REPOSITORY (server/src/repositories/routing.repository.ts)
    ├── Origin Proximity: PostGIS ST_DWithin & ST_Distance candidate stops
    ├── Destination Proximity: PostGIS ST_DWithin & ST_Distance candidate stops
    ├── Transfer Pairs: Inter-stop walking connections (<= 450m)
    └── Transit Network Edges: Consecutive stop_times along active trips, routes, fares & shapes
    ↓
PATHFINDER ENGINE (server/src/routing/pathfinder.ts)
    ├── Walking-Only Direct Check (dist(origin, dest) <= maxWalkingDistanceMeters)
    ├── Multi-Criteria Bounded Search (priority queue over elapsed seconds)
    ├── State Constraint Protection (maxTransfers <= 3, maxExploredStates <= 5000)
    └── Destination Reached -> buildJourneyFromPath()
    ↓
JOURNEY DEDUPLICATOR (server/src/routing/journeyDeduplicator.ts)
    └── Filters out duplicate mode + route + stop sequence signatures
    ↓
ROUTE RANKER (server/src/routing/routeRanker.ts)
    └── Ranks & tags: FASTEST, CHEAPEST, LESS WALKING, FEWER TRANSFERS
    ↓
API RESPONSE ({ success: true, data: { routes: Journey[] } })
    ↓
MOBILE VISUALIZATION
    ├── RouteOptionsScreen: Category filter chips & comparison cards
    ├── RouteDetailsScreen: Step-by-step instructions, boarding/alighting pins
    └── MapView: Real PostGIS GeoJSON corridor polyline rendering
```

---

## 2. API Specifications

### Endpoint

`POST /api/routes/search`

### Request Body

```json
{
  "origin": {
    "latitude": 14.6538,
    "longitude": 121.0685,
    "name": "UP Diliman"
  },
  "destination": {
    "latitude": 14.6536,
    "longitude": 121.0531,
    "name": "Philcoa PUV Terminal"
  },
  "maxWalkingDistanceMeters": 1000,
  "maxTransfers": 3,
  "limit": 5
}
```

### Response Body

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "journey-transit-1",
        "label": "FASTEST",
        "isRecommended": true,
        "durationMinutes": 15,
        "fare": 13,
        "currency": "PHP",
        "walkingDistanceMeters": 180,
        "transfers": 0,
        "modes": ["walking", "jeepney", "walking"],
        "summary": "Via JEEP-05",
        "origin": { "latitude": 14.6538, "longitude": 121.0685, "name": "UP Diliman" },
        "destination": {
          "latitude": 14.6536,
          "longitude": 121.0531,
          "name": "Philcoa PUV Terminal"
        },
        "segments": [
          {
            "type": "walking",
            "mode": "walking",
            "fromStop": {
              "id": "origin",
              "name": "UP Diliman",
              "latitude": 14.6538,
              "longitude": 121.0685
            },
            "toStop": {
              "id": "stop-up-oval",
              "name": "UP Diliman Academic Oval",
              "latitude": 14.6538,
              "longitude": 121.0685
            },
            "durationMinutes": 1,
            "distanceMeters": 10,
            "fare": 0,
            "instructions": "Walk 10m to UP Diliman Academic Oval"
          },
          {
            "type": "transit",
            "mode": "jeepney",
            "routeId": "route-jeep-05",
            "routeName": "UP Campus - Philcoa",
            "routeCode": "JEEP-05",
            "modeColor": "#F59E0B",
            "fromStop": {
              "id": "stop-up-oval",
              "name": "UP Diliman Academic Oval",
              "latitude": 14.6538,
              "longitude": 121.0685
            },
            "toStop": {
              "id": "stop-philcoa",
              "name": "Philcoa PUV Terminal",
              "latitude": 14.6536,
              "longitude": 121.0531
            },
            "durationMinutes": 14,
            "distanceMeters": 2800,
            "fare": 13,
            "stopsCount": 2,
            "departureTime": "06:00:00",
            "arrivalTime": "06:18:00",
            "instructions": "Board JEEP-05: UP Campus - Philcoa at UP Diliman Academic Oval and alight at Philcoa PUV Terminal (2 stops)"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Philippine Fare Calculation Engine

Fares are calculated according to Philippine LTFRB & Train statutory regular base fares and the database `fares` table:
$$fare = \max(\text{minimum\_fare}, \text{base\_fare} + \max(0, \text{distance\_km} - 4) \times \text{per\_km\_rate})$$

| Mode                           | Base Fare | Minimum Fare | Rate per km (>4km) |
| ------------------------------ | --------- | ------------ | ------------------ |
| **Traditional Jeepney**        | ₱13.00    | ₱13.00       | ₱1.80 / km         |
| **Public Bus (EDSA Carousel)** | ₱15.00    | ₱15.00       | ₱2.20 / km         |
| **MRT-3 Train**                | ₱13.00    | ₱13.00       | ₱1.00 / km         |
| **LRT-2 Train**                | ₱15.00    | ₱15.00       | ₱1.20 / km         |
| **UV Express**                 | ₱25.00    | ₱25.00       | ₱2.50 / km         |
| **Tricycle**                   | ₱12.00    | ₱12.00       | ₱2.00 / km         |
| **Walking**                    | ₱0.00     | ₱0.00        | ₱0.00 / km         |

---

## 4. Multi-Criteria Ranking & Pareto Alternatives

Journeys are deterministically evaluated across 4 key dimensions:

1. **FASTEST**: Lowest total trip duration in minutes.
2. **CHEAPEST**: Lowest total passenger fare in PHP.
3. **LESS WALKING**: Lowest total pedestrian distance in meters.
4. **FEWER TRANSFERS**: Lowest number of inter-modal transfers.

---

## 5. Phase 7 Integration Readiness

The outputs produced by Phase 6 (`Journey`, `JourneySegment`, `boardingPoint`, `alightingPoint`, and `LineString` geometries) are directly consumable by Phase 7 for active live navigation guidance.
