# BiyaEase Live Navigation & Real-Time Commute Alerts

Phase 9 upgrades the client-side active commute system into a production-grade live navigation experience tailored for Metro Manila's multimodal transit network (Jeepney, Bus, MRT, LRT, UV Express, and Walking).

---

## 1. Navigation Architecture

```
Commuter GPS Location (locationService)
       │
       ▼
JourneyContext (handleLocationUpdate)
       │
       ▼
NavigationEngine.update()
  ├── 1. NavigationMatcher (Polyline projection, along-track %, cross-track deviation)
  ├── 2. NextStopTracker (In-transit stops remaining countdown, alight distance)
  ├── 3. OffRouteDetector (3-strike off-corridor rule, wrong-direction walking checks)
  └── 4. AlertService (Deduplication, 1 alert per step event)
         ├── HapticService (Typed vibration pulses)
         └── AudioAlertService (Web Audio chime tones)
       │
       ▼
NavigationState
       ├── NavigationGuidanceCard (Action buttons, ETA, step instructions)
       ├── NextStopCard (Live countdown of stops inside transit vehicles)
       ├── AlertBanner (Contextual popups for boarding, alighting, transfer, arrival)
       ├── OffRouteCard (Recenter, continue, or recalculate guidance)
       └── MapView (Dynamic auto-follow camera with manual pan & Recenter button)
```

---

## 2. Navigation State Machine

The navigation engine deterministically transitions through the following states:

1. **`walking_to_board`**: Commuter is walking toward the initial boarding stop ($>120$m away).
2. **`approaching_board`**: Commuter is within $120$m of the boarding stop. Triggers **Approaching Boarding Stop** alert, double-pulse haptic, and chime.
3. **`boarding`**: Commuter is at the boarding stop ($\le 50$m). Displays **"You're at your stop: Board [Route]"**.
4. **`in_transit`**: Commuter has boarded and is riding the vehicle. Displays upcoming stop, remaining stops countdown, and distance.
5. **`approaching_alight`**: Commuter is within $150$m of the alighting stop. Triggers **Get Ready to Alight** alert, urgent triple-pulse haptic, and warning tone.
6. **`alighting`**: Commuter is at the alighting stop ($\le 60$m). Action button switches to **"I've Alighted"**.
7. **`transfer`**: Commuter is walking between stops in a multi-leg journey. Displays transfer instructions and next mode badge.
8. **`walking_to_destination`**: Commuter is on the final walking leg toward the destination.
9. **`arrived`**: Commuter is within $40$m of destination. Triggers **You Have Arrived!** celebration banner, haptic pulse, and arrival chime.
10. **`off_route`**: Interruption state entered when 3 consecutive GPS readings exceed $>400$m off-corridor. Automatically recovers when the commuter returns within $\le 200$m.

---

## 3. Route Progress Matching (`navigationMatcher.ts`)

- **Cartesian Projection**: Projects GPS coordinates onto the polyline segments using latitude-compensated meters.
- **Cross-Track Distance**: Computes perpendicular distance to determine if the commuter is within the expected road corridor ($\le 250$m).
- **Along-Track Progress**: Traverses segments from origin up to the projection point to compute exact traveled distance, remaining distance, and completion percentage ($0\% - 100\%$).

---

## 4. In-Transit Next Stop Countdown (`nextStopTracker.ts`)

- Dynamically tracks remaining stops in transit legs:
  - Interpolates current vehicle position against total step distance and GTFS stop count.
  - Generates real-time countdown: `🚏 3 stops remaining` $\rightarrow$ `🚏 2 stops remaining` $\rightarrow$ `🏁 Next stop is your alight stop`.
  - Flags `isApproachingAlight = true` when distance to alight stop drops below $150$m.

---

## 5. 3-Strike Off-Route & Wrong-Direction Detection (`offRouteDetector.ts`)

- **3-Strike Rule**: Prevents false alarms from single noisy GPS readings in dense urban canyons (e.g., under MRT-3 viaducts on EDSA). Requires **3 consecutive readings** $>400$m from corridor before declaring `off_route`.
- **Wrong-Direction Walking**: On pedestrian legs, monitors distance-to-target delta over time. If distance increases by $>15$m across consecutive updates, triggers directional guidance: `"You're moving away from your stop. Turn around."`
- **Auto-Recovery**: Instantly clears off-route state and resumes normal guidance when GPS readings re-enter within $\le 200$m.

---

## 6. Alert Deduplication & Sensory Feedback (`alertService.ts`, `hapticService.ts`, `audioAlertService.ts`)

- **Deduplication**: Keyed by `${stepIndex}_${alertType}` ensuring that alerts fire **exactly once per journey step**.
- **Haptic Patterns**:
  - _Boarding Approach_: 2 short pulses `[100ms, 100ms, 100ms]`.
  - _Boarding Arrival_: 1 solid pulse `[250ms]`.
  - _Alighting Approach_: 3 urgent pulses `[150ms, 100ms, 150ms, 100ms, 200ms]`.
  - _Transfer_: Double pulse `[120ms, 80ms, 120ms]`.
  - _Destination Arrival_: Celebration sequence `[200ms, 100ms, 200ms, 100ms, 400ms]`.
  - _Off-Route Warning_: Long warning vibration `[300ms, 150ms, 300ms]`.
- **Audio Chimes**: Synthesizes pleasant Web Audio tones (e.g., C5-E5-G5 for arrival, high A5 for alighting alert) with safe non-blocking fallbacks.

---

## 7. Dynamic Map Camera Behavior

- **Auto-Follow**: Automatically centers the map camera on the commuter's location as they move along the journey corridor.
- **Manual Interaction Override**: When the commuter pans or zooms the map, auto-follow is temporarily disabled, and a floating **🎯 Recenter** button appears on the top-right.
- **Recenter Control**: Tapping **🎯 Recenter** re-engages camera auto-follow and snaps the view back to the commuter.

---

## 8. Battery & Performance Strategy

- **Single GPS Watcher**: Reuses the Phase 7 `locationService` singleton; no redundant watchers.
- **Local Client Computation**: All navigation state evaluations, projections, and stop tracker computations run on-device, preserving battery and guaranteeing functionality in offline or weak-signal areas.
- **Memory & Timer Safety**: State references are backed by React `useRef` to eliminate unnecessary re-renders and passive effect render cascades.
