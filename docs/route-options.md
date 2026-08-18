# BiyaEase Route Options & Advanced Journey Comparison (Phase 8)

## 1. Overview

The **BiyaEase Route Options & Advanced Journey Comparison Engine** empowers Filipino commuters to evaluate multiple valid commute journeys based on travel time, fare cost, walking distance, transfers, transit modes, and route codes before starting active navigation.

---

## 2. Architecture & Pipeline

```text
Location Search
       ↓
Origin + Destination
       ↓
POST /api/routes/search (Phase 6 Routing Engine)
       ↓
Multiple Journey Alternatives
       ↓
Phase 8 Deterministic Route Comparison / Multi-Criteria Ranking
       ↓
Route Options Screen (Mode Filters + Sorting + Tradeoff Cards)
       ↓
Route Details Screen (Step Timeline + Map Preview)
       ↓
Phase 7 Active Journey (ActiveJourneyScreen)
```

---

## 3. Deterministic Ranking Logic (`routeRanker.ts`)

| Category             | Primary Metric              | Secondary Metric      | Tertiary Metric             |
| :------------------- | :-------------------------- | :-------------------- | :-------------------------- |
| **Fastest**          | `durationMinutes ASC`       | `transfers ASC`       | `walkingDistanceMeters ASC` |
| **Cheapest**         | `fare ASC`                  | `durationMinutes ASC` | `transfers ASC`             |
| **Least Walking**    | `walkingDistanceMeters ASC` | `transfers ASC`       | `durationMinutes ASC`       |
| **Fewest Transfers** | `transfers ASC`             | `durationMinutes ASC` | `walkingDistanceMeters ASC` |

- **Multi-Label Recommendations**: If a single route qualifies as both Fastest and Cheapest, it receives both recommendation badges (`['fastest', 'cheapest']`).
- **Route Count Limit**: Default 5 routes maximum, bounded strictly between 1 and 10.

---

## 4. Mobile Route Comparison Features

- **Mode Filters**: All Modes, Jeepney, Bus, MRT, LRT, UV Express, Walking.
- **Sort Controls**: Recommended, Fastest, Cheapest, Least Walking, Fewest Transfers (runs client-side with 0 network latency).
- **Formatted Metrics**:
  - Duration: `38 min` / `1 hr 12 min`
  - Fare: `₱25` / `Free`
  - Walking distance: `640 m` / `1.2 km`
  - Transfers: `Direct` / `1 transfer`
- **Full Screen Reader Accessibility**: Structured ARIA / accessibility labels on every route card.

---

## 5. Strict Phase Boundaries

- ✅ Route comparison, ranking, filtering, sorting, and Phase 7 active navigation handover.
- ❌ No turn-by-turn voice navigation, no live vehicle GPS tracking, no payment systems, no user accounts.
