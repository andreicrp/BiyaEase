import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ActiveJourney, JourneyStatus, JourneyStep, UserLocation } from '../types/journey.types';
import { RouteOption } from '../types/index';
import { Journey } from '../types/routing.types';
import { journeyAdapter } from '../services/journeyAdapter';
import { locationService } from '../services/locationService';
import { journeyProgressService, StepProgressResult } from '../services/journeyProgressService';
import { navigationEngine } from '../navigation/navigationEngine';
import { NavigationState } from '../navigation/navigationTypes';
import { alertService } from '../services/alertService';

export interface JourneyContextType {
  activeJourney: ActiveJourney | null;
  currentStep: JourneyStep | null;
  currentLocation: UserLocation | null;
  progressResult: StepProgressResult | null;
  navigationState: NavigationState | null;
  gpsError: string | null;
  isTracking: boolean;
  hasRestoredJourney: boolean;
  startJourney: (route: Journey | RouteOption | ActiveJourney) => void;
  advanceStep: () => void;
  confirmBoarded: () => void;
  confirmAlighted: () => void;
  completeJourney: () => void;
  cancelJourney: () => void;
  updateLocation: (location: UserLocation) => void;
  discardActiveJourney: () => void;
}

const STORAGE_KEY = 'biyaease.activeJourney.v1';

// In-memory or AsyncStorage mock
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignored
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignored
    }
  },
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJourney, setActiveJourney] = useState<ActiveJourney | null>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [progressResult, setProgressResult] = useState<StepProgressResult | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [hasRestoredJourney, setHasRestoredJourney] = useState<boolean>(false);

  const activeJourneyRef = useRef<ActiveJourney | null>(null);
  activeJourneyRef.current = activeJourney;

  const currentStep: JourneyStep | null =
    activeJourney &&
    activeJourney.steps &&
    activeJourney.currentStepIndex < activeJourney.steps.length
      ? activeJourney.steps[activeJourney.currentStepIndex] || null
      : null;

  const currentStepRef = useRef<JourneyStep | null>(null);
  currentStepRef.current = currentStep;

  const initialStepDistanceRef = useRef<number | undefined>(undefined);

  // 1. Restore persisted journey on startup (mount only)
  useEffect(() => {
    let isMounted = true;
    async function restore() {
      try {
        const raw = await storage.getItem(STORAGE_KEY);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          // Validate structure
          if (
            parsed &&
            typeof parsed.id === 'string' &&
            Array.isArray(parsed.steps) &&
            typeof parsed.currentStepIndex === 'number' &&
            parsed.status !== 'completed' &&
            parsed.status !== 'cancelled'
          ) {
            setActiveJourney(parsed);
            if (parsed.currentLocation) {
              setCurrentLocation(parsed.currentLocation);
            }
          } else {
            await storage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        await storage.removeItem(STORAGE_KEY);
      } finally {
        if (isMounted) setHasRestoredJourney(true);
      }
    }
    restore();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (
      activeJourney &&
      activeJourney.status !== 'completed' &&
      activeJourney.status !== 'cancelled'
    ) {
      storage.setItem(STORAGE_KEY, JSON.stringify(activeJourney));
    } else {
      storage.removeItem(STORAGE_KEY);
    }
  }, [activeJourney?.id, activeJourney?.status, activeJourney?.currentStepIndex]);

  // 3. Stable Location update handler (Zero re-renders / Zero passive effect loops)
  const handleLocationUpdate = useCallback((loc: UserLocation) => {
    setCurrentLocation((prevLoc) => {
      if (
        prevLoc &&
        Math.abs(prevLoc.latitude - loc.latitude) < 0.00001 &&
        Math.abs(prevLoc.longitude - loc.longitude) < 0.00001
      ) {
        return prevLoc;
      }
      return loc;
    });
    setGpsError(null);

    const currJourney = activeJourneyRef.current;
    const currStep = currentStepRef.current;

    if (!currJourney || !currStep) return;

    // Evaluate progress with Phase 7 service
    const result = journeyProgressService.evaluateStepProgress(
      loc,
      currStep,
      initialStepDistanceRef.current
    );
    setProgressResult(result);

    // Record initial distance for off-route tracking
    if (initialStepDistanceRef.current === undefined && result.distanceMeters > 0) {
      initialStepDistanceRef.current = result.distanceMeters;
    }

    // Evaluate live navigation state with Phase 9 NavigationEngine
    const nextStep =
      currJourney.currentStepIndex < currJourney.steps.length - 1
        ? currJourney.steps[currJourney.currentStepIndex + 1]
        : undefined;

    const navState = navigationEngine.update({
      userLocation: loc,
      currentStep: currStep,
      nextStep,
      allSteps: currJourney.steps,
      stepIndex: currJourney.currentStepIndex,
      polylineCoordinates: currJourney.polylineCoordinates,
    });
    setNavigationState(navState);
  }, []);

  // 4. Start watching GPS only when journey starts or changes status
  const journeyId = activeJourney?.id;
  const journeyStatus = activeJourney?.status;

  useEffect(() => {
    if (
      journeyId &&
      journeyStatus &&
      journeyStatus !== 'completed' &&
      journeyStatus !== 'cancelled'
    ) {
      setIsTracking(true);
      locationService.startWatching(handleLocationUpdate, (err) => setGpsError(err));
    } else {
      setIsTracking(false);
      locationService.stopWatching();
      initialStepDistanceRef.current = undefined;
    }

    return () => {
      locationService.stopWatching();
    };
  }, [journeyId, journeyStatus, handleLocationUpdate]);

  // 5. Start a new journey
  const startJourney = useCallback((route: Journey | RouteOption | ActiveJourney) => {
    let journeyModel: ActiveJourney;

    if ('steps' in route && 'currentStepIndex' in route && 'status' in route) {
      journeyModel = route as ActiveJourney;
    } else if ('segments' in route) {
      journeyModel = journeyAdapter.fromJourney(route as Journey);
    } else {
      journeyModel = journeyAdapter.fromRouteOption(route as RouteOption);
    }

    initialStepDistanceRef.current = undefined;
    navigationEngine.reset();
    alertService.reset();
    setNavigationState(null);
    setActiveJourney(journeyModel);
  }, []);

  // 6. Advance step
  const advanceStep = useCallback(() => {
    const curr = activeJourneyRef.current;
    if (!curr) return;
    const nextIdx = curr.currentStepIndex + 1;

    if (nextIdx >= curr.steps.length) {
      completeJourney();
      return;
    }

    const nextStep = curr.steps[nextIdx];
    let nextStatus: JourneyStatus = curr.status;

    if (nextStep) {
      if (nextStep.type === 'board') nextStatus = 'boarding';
      else if (nextStep.type === 'transit') nextStatus = 'in_transit';
      else if (nextStep.type === 'alight') nextStatus = 'alighting';
      else if (nextStep.type === 'destination') nextStatus = 'walking_to_destination';
      else if (nextStep.type === 'walk' || nextStep.type === 'transfer')
        nextStatus = 'walking_to_stop';
    }

    initialStepDistanceRef.current = undefined;

    setActiveJourney((prev) => {
      if (!prev) return null;
      const updatedSteps = [...prev.steps];
      if (updatedSteps[prev.currentStepIndex]) {
        updatedSteps[prev.currentStepIndex] = {
          ...updatedSteps[prev.currentStepIndex]!,
          completed: true,
        };
      }
      return {
        ...prev,
        status: nextStatus,
        currentStepIndex: nextIdx,
        steps: updatedSteps,
      };
    });
  }, []);

  // 7. Transit confirmations
  const confirmBoarded = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  const confirmAlighted = useCallback(() => {
    advanceStep();
  }, [advanceStep]);

  // 8. Complete journey
  const completeJourney = useCallback(() => {
    setActiveJourney((prev) => {
      if (!prev) return null;
      const updatedSteps = prev.steps.map((s) => ({ ...s, completed: true }));
      return {
        ...prev,
        status: 'completed',
        completedAt: new Date().toISOString(),
        steps: updatedSteps,
      };
    });
    locationService.stopWatching();
  }, []);

  // 9. Cancel journey
  const cancelJourney = useCallback(() => {
    locationService.stopWatching();
    navigationEngine.reset();
    alertService.reset();
    setActiveJourney((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    storage.removeItem(STORAGE_KEY);
    setTimeout(() => {
      setActiveJourney(null);
      setProgressResult(null);
      setNavigationState(null);
    }, 100);
  }, []);

  // 10. Discard persisted journey
  const discardActiveJourney = useCallback(() => {
    locationService.stopWatching();
    navigationEngine.reset();
    alertService.reset();
    setActiveJourney(null);
    setProgressResult(null);
    setNavigationState(null);
    storage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        activeJourney,
        currentStep,
        currentLocation,
        progressResult,
        navigationState,
        gpsError,
        isTracking,
        hasRestoredJourney,
        startJourney,
        advanceStep,
        confirmBoarded,
        confirmAlighted,
        completeJourney,
        cancelJourney,
        updateLocation: handleLocationUpdate,
        discardActiveJourney,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
