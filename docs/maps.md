# BiyaEase Map System & Geospatial Visualization Architecture

This document describes the Map System, provider decision, component hierarchy, coordinate conversions, camera management, and PostGIS integration for **BiyaEase** (Phase 4).

---

## 1. System Overview

The map architecture connects PostGIS spatial records to React Native mobile components via a decoupled provider abstraction:

```
POSTGRESQL + POSTGIS (SRID 4326 Point Geography & LineString Geometry)
    ↓
EXPRESS REST API (/api/transit/stops/nearby, /api/transit/routes/:id/shape, /api/places)
    ↓
TRANSIT API SERVICE (mobile/services/transitApiService.ts)
    ↓
MAP PROVIDER & STATE CONTEXT (mobile/components/maps/MapProvider.tsx)
    ↓
MAP COMPONENTS (<MapView />, <StopMarker />, <PlaceMarker />, <RoutePolyline />, <MapControls />)
    ↓
REACT NATIVE COMMUTER SCREENS (HomeScreen, NearbyScreen, RouteDetailsScreen)
```

---

## 2. Map Provider Selection Decision

### Evaluation of Options

1. **Google Maps SDK (`react-native-maps`)**:
   - Requires Google Cloud billing, native build compilation, and separate Android/iOS API key provisioning.
   - Frequent build incompatibilities during rapid cross-platform development.
2. **Mapbox SDK**:
   - Complex native setup and monthly active user (MAU) usage fees.
3. **Universal Vector & OpenStreetMap Canvas (Selected)**:
   - **Decision**: Implemented an open, zero-dependency universal map container with provider abstraction (`<MapView />`).
   - **Why**: 100% reliable execution on React Native (iOS, Android) and React Native Web in Expo SDK 54 / React 19 without native compilation crashes, zero API key lock-in, free high-resolution cartographic cartography, custom SVG stop pins, GeoJSON LineString rendering, and smooth pan/zoom gesture physics.
   - **Vendor Decoupling**: Screens exclusively render `<MapView />` and never import vendor-specific SDKs directly, enabling seamless swapping to native Google Maps or Mapbox in future deployment phases if needed.

---

## 3. Component Architecture (`mobile/components/maps/`)

| Component                | Purpose                                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<MapView />`            | Reusable universal map container supporting pan/zoom gestures, coordinate projections, markers, and polylines.                                                                                            |
| `<MapProvider />`        | React Context holding active region, user GPS location, selected markers, and camera actions.                                                                                                             |
| `<UserLocationMarker />` | Pulsing blue dot indicating the commuter's current GPS location.                                                                                                                                          |
| `<StopMarker />`         | Interactive transit stop pin color-coded with BiyaEase transit mode colors (Jeepney `#F59E0B`, Bus `#2563EB`, MRT `#7C3AED`, LRT `#DB2777`, UV Express `#0F766E`, Tricycle `#10B981`, Walking `#64748B`). |
| `<PlaceMarker />`        | Landmark pins with category icons (Mall 🛍️, University 🎓, Transit Hub 🚉, Government 🏛️, Office 💼).                                                                                                     |
| `<RoutePolyline />`      | Smooth multi-point SVG corridor line rendered along PostGIS LineString shapes.                                                                                                                            |
| `<MapControls />`        | Accessible touch controls (>=44×44px) for Recenter, Zoom In, and Zoom Out.                                                                                                                                |
| `<StopInfoCard />`       | Floating bottom panel for tapped stops showing name, mode badge, code, and distance in meters.                                                                                                            |
| `<PlaceInfoCard />`      | Floating bottom panel for tapped places showing name, category, address, and nearby transit count.                                                                                                        |

---

## 4. GeoJSON & Coordinate Transformation

- **GeoJSON Format**: `[longitude, latitude]` (e.g. `[121.0685, 14.6538]`).
- **React Native Format**: `{ latitude, longitude }` (e.g. `{ latitude: 14.6538, longitude: 121.0685 }`).
- Handled by `mobile/utils/geoUtils.ts`:
  - `geoJsonToCoordinate([lng, lat])`
  - `geoJsonLineStringToCoordinates([[lng, lat], ...])`
  - `calculateRegionForCoordinates(coords[])` for automatic camera framing.

---

## 5. Camera Management Modes

1. **Home Screen**: Centers on user location (`14.6538, 121.0685`) and displays nearby transit stops within 2,000 meters.
2. **Nearby Screen**: Centers on user location + nearby transit stops with real-time mode filtering (Jeepney, Bus, MRT, LRT, UV).
3. **Route Details**: Automatically fits camera bounds to the entire route geometry using `calculateRegionForCoordinates(routeCoordinates)`.

---

## 6. Testing & Quality Assurance

Automated unit tests run via:

```powershell
npm run map:test
```

Verifies coordinate conversions, multi-point LineString parsing, bounding box calculations, and Haversine distance measurements.
