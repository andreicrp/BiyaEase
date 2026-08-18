# BiyaEase Active Journey & GPS Progress System (Phase 7)

## 1. Overview

The **BiyaEase Active Journey and GPS Progress System** enables Filipino commuters to actively navigate their calculated Phase 6 multimodal transit journeys in real time. It provides step-by-step guidance, proximity alerts (boarding, alighting, destination arrival), GPS accuracy validation, battery-efficient foreground tracking, and local state persistence.

---

## 2. Architecture & Data Flow

```text
User Selects Route (Phase 6)
       ↓
RouteDetailsScreen ("START TRIP 🚀")
       ↓
journeyAdapter.fromJourney()
       ↓
JourneyContext.startJourney() [Status: walking_to_stop / boarding]
       ↓
Foreground GPS Updates (locationService)
       ↓
journeyProgressService (Distance & Proximity Evaluator)
       ↓
ActiveJourneyScreen (MapView + Step Timeline + Guidance Card)
       ↓
State Transitions (Boarded → In Transit → Alighting → Arrived)
       ↓
Journey Completion / Cancellation
```

---

## 3. State Machine & Lifecycle

### Valid Journey States:

```text
ready
  ↓
walking_to_stop
  ↓
boarding
  ↓
in_transit
  ↓
alighting
  ↓
walking_to_destination
  ↓
completed
```

- **Cancellation**: Any active state $\rightarrow$ `cancelled` (requires user confirmation).
- **Proximity Thresholds**:
  - `WALK_PROXIMITY`: $40$ meters
  - `BOARD_PROXIMITY`: $50$ meters
  - `ALIGHT_PROXIMITY`: $120$ meters
  - `DESTINATION_PROXIMITY`: $40$ meters
  - `OFF_ROUTE_DEVIATION`: $400$ meters

---

## 4. Local Persistence & Recovery

- **Storage Key**: `biyaease.activeJourney.v1`
- **Behavior**:
  - State changes are persisted to client storage.
  - On app launch, in-progress active journeys are restored with schema validation.
  - Corrupted data is safely discarded without crashing.
  - The Home screen displays an **Active Commute in Progress** banner with **Resume** and **Discard** buttons.

---

## 5. Foreground GPS Tracking & Battery Safety

- Location tracking is active **only** while an active journey is in progress.
- Clean subscription teardown on journey completion, cancellation, or unmount.
- Accuracy filter flags readings $>100$m as low confidence.

---

## 6. Strict Phase Boundaries

- ✅ Active Journey execution, GPS proximity alerts, local storage persistence.
- ❌ No background GPS tracking, no real-time vehicle GPS, no turn-by-turn voice navigation, no user authentication, no database logging.
