import { Journey, JourneySegment } from '../types/routing.types';
import { ActiveJourney, JourneyStep } from '../types/journey.types';
import { RouteOption } from '../types';
import { interpolateRoadCorridor } from '../utils/geoUtils';

export const journeyAdapter = {
  /**
   * Transforms a Phase 6 calculated Journey into a trackable ActiveJourney model.
   */
  fromJourney(journey: Journey): ActiveJourney {
    const steps: JourneyStep[] = [];
    const polylineCoordinates: { latitude: number; longitude: number }[] = [];

    journey.segments.forEach((seg: JourneySegment, idx: number) => {
      // Add segment geometry points to master polyline
      if (seg.geometry && Array.isArray(seg.geometry.coordinates)) {
        seg.geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
          polylineCoordinates.push({ latitude: lat, longitude: lng });
        });
      } else if (seg.fromStop && seg.toStop) {
        polylineCoordinates.push({
          latitude: seg.fromStop.latitude,
          longitude: seg.fromStop.longitude,
        });
        polylineCoordinates.push({
          latitude: seg.toStop.latitude,
          longitude: seg.toStop.longitude,
        });
      }

      if (seg.type === 'walking') {
        const isFirst = idx === 0;
        const isLast = idx === journey.segments.length - 1;
        const isTransfer = !isFirst && !isLast;

        steps.push({
          id: `step-${idx}-walk`,
          type: isLast ? 'destination' : isTransfer ? 'transfer' : 'walk',
          title: isLast
            ? `Walk to ${journey.destination.name || 'destination'}`
            : isTransfer
              ? `Transfer walk to ${seg.toStop?.name || 'next stop'}`
              : `Walk to ${seg.toStop?.name || 'boarding stop'}`,
          subtitle: `${seg.distanceMeters}m · ~${seg.durationMinutes} min`,
          latitude: seg.toStop?.latitude || journey.destination.latitude,
          longitude: seg.toStop?.longitude || journey.destination.longitude,
          distanceMeters: seg.distanceMeters,
          estimatedMinutes: seg.durationMinutes,
          mode: 'walking',
          toStopId: seg.toStop?.id,
          toStopName: seg.toStop?.name || journey.destination.name,
          completed: false,
        });
      } else {
        // Transit segment -> generates 3 sub-steps:
        // 1. Board step (at fromStop)
        // 2. Transit in-vehicle step
        // 3. Alight step (at toStop)

        // Board step
        steps.push({
          id: `step-${idx}-board`,
          type: 'board',
          title: `Board ${seg.routeName || seg.routeCode || seg.mode.toUpperCase()}`,
          subtitle: `At ${seg.fromStop?.name || 'boarding stop'}`,
          latitude: seg.fromStop?.latitude,
          longitude: seg.fromStop?.longitude,
          estimatedMinutes: 2,
          routeId: seg.routeId,
          routeName: seg.routeName,
          routeCode: seg.routeCode,
          mode: seg.mode,
          fromStopId: seg.fromStop?.id,
          fromStopName: seg.fromStop?.name,
          fare: seg.fare,
          completed: false,
        });

        // Transit ride step
        steps.push({
          id: `step-${idx}-transit`,
          type: 'transit',
          title: `Ride ${seg.routeName || seg.routeCode || seg.mode.toUpperCase()}`,
          subtitle: `Towards ${seg.toStop?.name || 'destination'} · ~${seg.durationMinutes} min`,
          latitude: seg.toStop?.latitude,
          longitude: seg.toStop?.longitude,
          distanceMeters: seg.distanceMeters,
          estimatedMinutes: seg.durationMinutes,
          routeId: seg.routeId,
          routeName: seg.routeName,
          routeCode: seg.routeCode,
          mode: seg.mode,
          fromStopId: seg.fromStop?.id,
          fromStopName: seg.fromStop?.name,
          toStopId: seg.toStop?.id,
          toStopName: seg.toStop?.name,
          completed: false,
        });

        // Alight step
        steps.push({
          id: `step-${idx}-alight`,
          type: 'alight',
          title: `Get off at ${seg.toStop?.name || 'alighting stop'}`,
          subtitle: `Prepare to alight`,
          latitude: seg.toStop?.latitude,
          longitude: seg.toStop?.longitude,
          routeId: seg.routeId,
          routeName: seg.routeName,
          routeCode: seg.routeCode,
          mode: seg.mode,
          toStopId: seg.toStop?.id,
          toStopName: seg.toStop?.name,
          completed: false,
        });
      }
    });

    // Determine initial status based on the first step
    const firstStepType = steps[0]?.type;
    const initialStatus =
      firstStepType === 'board'
        ? 'boarding'
        : firstStepType === 'walk'
          ? 'walking_to_stop'
          : 'ready';

    return {
      id: journey.id || `active-journey-${Date.now()}`,
      status: initialStatus,
      startedAt: new Date().toISOString(),
      origin: {
        latitude: journey.origin.latitude,
        longitude: journey.origin.longitude,
        name: journey.origin.name,
      },
      destination: {
        latitude: journey.destination.latitude,
        longitude: journey.destination.longitude,
        name: journey.destination.name,
      },
      totalFare: journey.fare,
      totalDurationMinutes: journey.durationMinutes,
      steps,
      currentStepIndex: 0,
      polylineCoordinates: interpolateRoadCorridor(polylineCoordinates),
    };
  },

  /**
   * Adapter for legacy RouteOption models
   */
  fromRouteOption(option: RouteOption): ActiveJourney {
    const rawCoords: { latitude: number; longitude: number }[] = option.steps
      .filter((s) => s.coordinates)
      .map((s) => s.coordinates!);

    const steps: JourneyStep[] = option.steps.map((s, idx) => ({
      id: `step-${idx}-${s.id}`,
      type: (s.mode === 'walking' ? 'walk' : 'transit') as 'walk' | 'transit',
      title: s.title,
      subtitle: s.subtitle || `${s.distanceMeters}m · ~${s.durationMinutes} min`,
      latitude: s.coordinates?.latitude,
      longitude: s.coordinates?.longitude,
      distanceMeters: s.distanceMeters,
      estimatedMinutes: s.durationMinutes,
      mode: s.mode,
      fromStopName: s.originStop,
      toStopName: s.destinationStop,
      stopsCount: s.stopsCount,
      fare: s.fare,
      completed: false,
    }));

    return {
      id: `active-${option.id}`,
      status: 'walking_to_stop',
      startedAt: new Date().toISOString(),
      origin: {
        latitude: 14.6538,
        longitude: 121.0685,
        name: option.origin,
      },
      destination: {
        latitude: 14.6565,
        longitude: 121.0288,
        name: option.destination,
      },
      totalFare: option.totalFare,
      totalDurationMinutes: option.totalDurationMinutes,
      steps,
      currentStepIndex: 0,
      polylineCoordinates: interpolateRoadCorridor(rawCoords),
    };
  },
};
