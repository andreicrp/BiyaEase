import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ActiveJourney, JourneyStatus, JourneyStep, UserLocation } from '../types/journey.types';
import { Journey } from '../types/routing.types';
import { RouteOption } from '../types';
import { journeyAdapter } from '../services/journeyAdapter';
import { locationService } from '../services/locationService';
import { journeyProgressService, StepProgressResult } from '../services/journeyProgressService';

const STORAGE_KEY = 'biyaease.activeJourney.v1';

// Cross-platform local storage helper (supports Web localStorage and memory fallback)
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

interface JourneyContextType {
  activeJourney: ActiveJourney | null;
  currentStep: JourneyStep | null;
  currentLocation: UserLocation | null;
  progressResult: StepProgressResult | null;
  gpsError: string | null;
  isTracking: boolean;
  hasRestoredJourney: boolean;
  startJourney: (route: Journey | RouteOption | ActiveJourney) => void;
  advanceStep: () => void;
  confirmBoarded: () => void;
  confirmAlighted: () => void;
  completeJourney: () => void;
  cancelJourney: () => void;
  updateLocation: (loc: UserLocation) => void;
  discardActiveJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeJourney, setActiveJourney] = useState<ActiveJourney | null>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [progressResult, setProgressResult] = useState<StepProgressResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [hasRestoredJourney, setHasRestoredJourney] = useState<boolean>(false);

  const initialStepDistanceRef = useRef<number | undefined>(undefined);

  // 1. Restore persisted journey on startup
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
            // Clean invalid or completed journey
            await storage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Corrupted JSON -> remove safely
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
  }, [activeJourney]);

  // Current step getter
  const currentStep =
    activeJourney &&
    activeJourney.steps &&
    activeJourney.currentStepIndex < activeJourney.steps.length
      ? activeJourney.steps[activeJourney.currentStepIndex] || null
      : null;

  // 3. Location update handler
  const handleLocationUpdate = useCallback(
    (loc: UserLocation) => {
      setCurrentLocation(loc);
      setGpsError(null);

      if (!activeJourney || !currentStep) return;

      // Update location inside active journey
      setActiveJourney((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentLocation: loc,
        };
      });

      // Evaluate progress
      const result = journeyProgressService.evaluateStepProgress(
        loc,
        currentStep,
        initialStepDistanceRef.current
      );
      setProgressResult(result);

      // Record initial distance for off-route tracking
      if (initialStepDistanceRef.current === undefined && result.distanceMeters > 0) {
        initialStepDistanceRef.current = result.distanceMeters;
      }
    },
    [activeJourney, currentStep]
  );

  // 4. Start watching GPS when journey is active
  useEffect(() => {
    if (
      activeJourney &&
      activeJourney.status !== 'completed' &&
      activeJourney.status !== 'cancelled'
    ) {
      setIsTracking(true);
      locationService.startWatching(
        (loc) => handleLocationUpdate(loc),
        (err) => setGpsError(err)
      );
    } else {
      setIsTracking(false);
      locationService.stopWatching();
      initialStepDistanceRef.current = undefined;
    }

    return () => {
      locationService.stopWatching();
    };
  }, [activeJourney?.id, activeJourney?.status, handleLocationUpdate]);

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
    setActiveJourney(journeyModel);
  }, []);

  // 6. Advance step
  const advanceStep = useCallback(() => {
    if (!activeJourney) return;
    const nextIdx = activeJourney.currentStepIndex + 1;

    if (nextIdx >= activeJourney.steps.length) {
      completeJourney();
      return;
    }

    const nextStep = activeJourney.steps[nextIdx];
    let nextStatus: JourneyStatus = activeJourney.status;

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
  }, [activeJourney]);

  // 7. Transit confirmations
  const confirmBoarded = useCallback(() => {
    if (!activeJourney) return;
    advanceStep();
  }, [activeJourney, advanceStep]);

  const confirmAlighted = useCallback(() => {
    if (!activeJourney) return;
    advanceStep();
  }, [activeJourney, advanceStep]);

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
    setActiveJourney((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    storage.removeItem(STORAGE_KEY);
    // Reset to null after cancellation
    setTimeout(() => {
      setActiveJourney(null);
      setProgressResult(null);
    }, 100);
  }, []);

  // 10. Discard persisted journey
  const discardActiveJourney = useCallback(() => {
    locationService.stopWatching();
    setActiveJourney(null);
    setProgressResult(null);
    storage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        activeJourney,
        currentStep,
        currentLocation,
        progressResult,
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
