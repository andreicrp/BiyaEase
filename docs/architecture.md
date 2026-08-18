# BiyaEase Architecture Documentation

BiyaEase is a comprehensive Philippine public transportation and commute navigation platform designed to simplify daily commutes across jeepneys, UV Express, buses, MRT/LRT rail, tricycles, and walking paths.

---

## 1. System Overview

```mermaid
flowchart TD
    ClientMobile["📱 BiyaEase Mobile App\n(React Native / Expo)"]
    ClientWeb["💻 Admin Dashboard\n(React / Vite)"]

    subgraph IngestionEngine ["GTFS & Transit Ingestion Engine (Phase 3)"]
        Parser["Streaming CSV Parser"]
        Validator["Feed & Coordinate Validator"]
        Normalizer["Philippine Mode Mapper & Normalizer"]
        Importer["Transactional Batch Importer & Deduplicator"]

        Parser --> Validator --> Normalizer --> Importer
    end

    subgraph BackendAPI ["BiyaEase API Gateway (Express / Node.js)"]
        Router["Express Routers"]
        Controllers["Controllers"]
        Middlewares["Middlewares (CORS, Error, Auth)"]
        Services["Domain Services"]
        Repositories["Spatial Repositories"]

        Router --> Middlewares --> Controllers --> Services --> Repositories
    end

    subgraph DataLayer ["Data Storage & Geodata (Phase 2 + 3)"]
        Postgres[("PostgreSQL 16+")]
        PostGIS["PostGIS Spatial Engine"]
        Sources["transit_sources & transit_datasets"]
        Postgres --- PostGIS
        Postgres --- Sources
    end

    subgraph FutureIntegrations ["Future Phase Engines (Phase 4+)"]
        MapsAPI["Google Maps Platform / Places API"]
        RoutingEngine["Multi-Modal Routing Engine"]
        Realtime["Real-time Vehicle Tracking / WebSockets"]
    end

    ClientMobile -->|REST / HTTPS| Router
    ClientWeb -->|REST / HTTPS| Router
    IngestionEngine --> Postgres
    Repositories --> Postgres
    Services -.-> FutureIntegrations
```

---

## 2. Layered Architecture Pattern

The backend strictly implements clean separation of concerns:

```
Route (Request Routing & URL Mapping)
  └── Controller (HTTP Parsing, Status Codes, Input Validation)
        └── Service (Pure Business Logic & Domain Algorithms)
              └── Database / Data Access (PostgreSQL / PostGIS Queries)
```

- **Routes (`server/src/routes/`)**: Map URI patterns and HTTP verbs to controller methods. No business logic is placed directly in route definitions.
- **Controllers (`server/src/controllers/`)**: Handle incoming HTTP requests, extract parameters, invoke domain services, and return standard JSON responses.
- **Services (`server/src/services/`)**: Encapsulate pure business logic, calculations, route analysis, and transit data orchestration.
- **Repositories (`server/src/repositories/`)**: Encapsulate parameterized SQL and PostGIS spatial queries (`ST_DWithin`, `ST_Distance`).
- **Database (`server/src/database/`)**: Manage connection pooling (`pg`), PostGIS queries, parameterized SQL execution, and migrations.
- **GTFS Ingestion (`server/src/gtfs/`)**: Parse, validate, normalize, and transactionally import transit feeds.

---

## 3. Technology Stack

| Layer               | Technology                     | Purpose                                                     |
| ------------------- | ------------------------------ | ----------------------------------------------------------- |
| **Mobile Client**   | React Native, Expo, TypeScript | Cross-platform commuter application (iOS & Android)         |
| **Admin Dashboard** | React, Vite, TypeScript        | Internal transit data & community reports management        |
| **Backend API**     | Node.js, Express, TypeScript   | Scalable REST API gateway & service layer                   |
| **Database**        | PostgreSQL, PostGIS            | Relational storage & geospatial indexing for transit routes |
| **GTFS Ingestion**  | TypeScript, PostGIS            | Streaming CSV parser, validator & transactional importer    |
| **Infrastructure**  | Railway                        | Containerized cloud deployment                              |
| **Package Manager** | npm (Workspaces)               | Monorepo package management                                 |

---

## 4. Phase Roadmap

```
PHASE 0: Project Foundation (Complete)
└── Monorepo setup, server scaffolding, health check, DB connector, TypeScript & linting.

PHASE 1: UI/UX Foundation (Complete)
└── Mobile UI screens with mock data (Splash, Onboarding, Home, Search, Route Options, Details, Nav shell).

PHASE 2: Database (Complete)
└── PostgreSQL schema, PostGIS geometry types, migrations for stops, routes, fares, and schedules.

PHASE 3: GTFS Importer & Real Transit Data Foundation (Complete)
└── Import, parse, validate, and store Philippine GTFS feeds and transit schedule data with provenance.

PHASE 4: Map System & Geospatial Visualization (Complete)
└── Universal MapView provider abstraction, PostGIS GeoJSON polyline rendering, Stop & Place markers, and camera bounds management.

PHASE 5: Location Search & Place Autocomplete (Complete)
└── Unified multi-entity search across places, stops, stations, and routes with pg_trgm GIN indexing, PostGIS proximity distance ranking, and 300ms debounced mobile autocomplete.

PHASE 6: Multi-Modal Routing Engine (Complete)
└── Graph-based multi-modal pathfinding across walking, jeepney, bus, MRT, and LRT corridors with PostGIS proximity queries, GTFS schedule time calculations, statutory fare matrix calculations, multi-criteria ranking, and mobile MapView polyline visualization.

PHASE 7: Active Journey & GPS Progress System (Complete)
└── Client-side active journey state machine (JourneyContext), foreground GPS tracking (locationService), proximity detection engine (journeyProgressService), boarding and alighting alerts, and local persistence.

PHASE 8: Route Details
└── Step-by-step turn/transfer instructions, boarding points, landmark hints, and fare breakdown.

PHASE 9: Navigation
└── Active trip guidance, turn-by-turn alerts, and alight/transfer notifications.

PHASE 10: Saved Places
└── Bookmark frequently visited locations (Home, Work, School, Favorites).

PHASE 11: Authentication
└── User registration, login, secure session tokens (JWT), and profile management.

PHASE 12: Community Reports
└── Commuter crowdsourced reports (traffic delays, broken trains, fare changes, long queues).

PHASE 13: Admin Dashboard
└── Web interface for system analytics, commuter metrics, and data moderation.

PHASE 14: Transit Data Management
└── Admin tools to edit routes, stops, schedules, and fare matrices.

PHASE 15: Real-Time Vehicles
└── Live vehicle GPS tracking, estimated arrival times (ETA), and WebSockets.

PHASE 16: Security + Performance
└── Rate limiting, query optimization, spatial indexing, caching (Redis), penetration testing.

PHASE 17: Testing
└── Comprehensive unit, integration, end-to-end (E2E), and load testing.

PHASE 18: Production Deployment
└── CI/CD pipeline, Railway staging/production environments, domain setup, monitoring.
```

---

## 5. Security & Deployment Foundation

- **Secrets Management**: No credentials in source control; `.env` is git-ignored and configured through Railway environment variables.
- **Strict Parameterization**: All SQL queries use prepared statements.
- **Controlled CORS**: Restricted in production to whitelisted client domains.
- **Fail-Safe Health Checks**: Dedicated `/api/health` endpoint for infrastructure probes.
