# BiyaEase Saved Places & Favorite Routes Architecture Documentation (Phase 10)

## 1. Executive Summary

Phase 10 introduces local-first persistence for **Saved Places** (Home, Work, School, Favorites) and **Favorite Routes** (commute templates) in BiyaEase without requiring user authentication.

All saved entities are persisted locally on the commuter's device using versioned storage keys. The storage layer is strictly decoupled behind repository interfaces (`SavedPlacesRepository`, `FavoriteRoutesRepository`), enabling Phase 11 to introduce server synchronization without requiring UI refactoring.

---

## 2. Architecture & Data Flow

```
[ SavedPlacesScreen / FavoriteRoutesScreen ]
                    │
                    ▼
          [ SavedDataContext ]
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │       Repository Abstractions        │
 │  - SavedPlacesRepository             │
 │  - FavoriteRoutesRepository          │
 └──────────────────┬───────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │     Local Storage Implementations    │
 │  - LocalSavedPlacesRepository        │
 │  - LocalFavoriteRoutesRepository     │
 └──────────────────┬───────────────────┘
                    │
                    ▼
          [ localStorageService ]
         (Versioned Storage Keys)
```

---

## 3. Data Models

### Saved Place (`SavedPlace`)
```typescript
export type SavedPlaceCategory =
  | 'home'
  | 'work'
  | 'school'
  | 'favorite'
  | 'other';

export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  type?: SearchResultType;
  category: SavedPlaceCategory;
  createdAt: number;
  updatedAt: number;
}
```

### Favorite Route (`FavoriteRoute`)
```typescript
export interface SavedLocationReference {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
}

export interface FavoriteRoute {
  id: string;
  name: string;
  origin: SavedLocationReference;
  destination: SavedLocationReference;
  journeyId?: string;
  modeSummary?: string[];
  routeSummary?: string;
  estimatedDurationMinutes?: number;
  estimatedFare?: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

> **Design Principle**: Favorite Routes store location references (`origin` + `destination` coordinates and names) rather than permanently freezing journey polylines. When launched, the Phase 6 multi-modal routing engine recalculates live transit options so schedules and fares remain 100% up to date.

---

## 4. Local Persistence & Storage Keys

- **Saved Places Key**: `biyaease.savedPlaces.v1`
- **Favorite Routes Key**: `biyaease.favoriteRoutes.v1`

### Resilience & Error Recovery
If local storage becomes corrupted or unreadable:
1. `localStorageService` catches JSON syntax errors gracefully.
2. Returns clean fallback arrays `[]`.
3. Never crashes the application or interrupts active navigation.

---

## 5. Validation & Limits

- **Coordinate Bounds**: Latitude must be between `-90` and `90`. Longitude must be between `-180` and `180`.
- **Non-Empty Titles**: Names for saved places and favorite routes must be non-empty strings.
- **Maximum Storage Limits**:
  - Saved Places: Maximum **50 entries**.
  - Favorite Routes: Maximum **50 entries**.

---

## 6. Deduplication & Uniqueness Constraints

### Deduplication
- **Saved Places**: An entry is flagged as a duplicate if it matches an existing saved place with the **same normalized name** (`name.trim().toLowerCase()`) AND coordinates within **30 meters** (Haversine distance).
- **Favorite Routes**: Primary duplicate key evaluates both **origin coordinates** AND **destination coordinates** within 30m.

### Home & Work Uniqueness
- **Home**: Maximum 1 location category.
- **Work**: Maximum 1 location category.
- If a commuter attempts to save a new place as Home (or Work), the system prompts for explicit replacement confirmation before downgrading the previous entry to `'favorite'`.

---

## 7. Phase 11 Server Migration Strategy

The UI components consume data exclusively via `SavedDataContext` and abstract repository interfaces (`SavedPlacesRepository`, `FavoriteRoutesRepository`).

When Phase 11 introduces authentication and user accounts:
1. Create `RemoteSavedPlacesRepository` implementing `SavedPlacesRepository`.
2. Inject `RemoteSavedPlacesRepository` into `SavedDataProvider`.
3. Zero changes required in `SavedPlacesScreen`, `FavoriteRoutesScreen`, `HomeScreen`, or `SearchScreen`.
