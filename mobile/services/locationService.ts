import { UserLocation } from '../types/journey.types';

export type LocationCallback = (location: UserLocation) => void;
export type LocationErrorCallback = (error: string) => void;

class LocationService {
  private watcherId: number | NodeJS.Timeout | null = null;
  private isWatching = false;
  private lastLocation: UserLocation | null = null;

  /**
   * Validate that GPS coordinates fall within valid geographic bounds
   */
  isValidCoordinate(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Filter GPS accuracy. Returns true if accuracy is high/acceptable (<= 100m)
   */
  isAccuracyAcceptable(accuracy?: number): boolean {
    if (accuracy === undefined || accuracy === null) return true;
    return accuracy <= 100;
  }

  /**
   * Normalizes raw GPS reading into typed UserLocation
   */
  normalizeLocation(coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
  }): UserLocation | null {
    if (!this.isValidCoordinate(coords.latitude, coords.longitude)) {
      return null;
    }

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy || undefined,
      altitude: coords.altitude || undefined,
      heading: coords.heading || undefined,
      speed: coords.speed || undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Request permission and start watching foreground GPS location
   */
  async startWatching(
    onLocation: LocationCallback,
    onError?: LocationErrorCallback
  ): Promise<boolean> {
    if (this.isWatching) {
      return true;
    }

    try {
      // Check if browser / web geolocation is available
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = this.normalizeLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            });

            if (loc) {
              this.lastLocation = loc;
              onLocation(loc);
            }
          },
          (err) => {
            onError?.(err.message || 'GPS location error');
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );

        this.watcherId = id;
        this.isWatching = true;
        return true;
      }

      // Fallback for native runtime: default UP Diliman origin (async to avoid render cycle locks)
      const defaultLoc: UserLocation = {
        latitude: 14.6538,
        longitude: 121.0685,
        accuracy: 10,
        timestamp: new Date().toISOString(),
      };
      this.lastLocation = defaultLoc;
      this.isWatching = true;
      setTimeout(() => {
        if (this.isWatching) {
          onLocation(defaultLoc);
        }
      }, 0);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start GPS watcher';
      onError?.(msg);
      return false;
    }
  }

  /**
   * Stop watching GPS to conserve battery
   */
  stopWatching(): void {
    if (this.watcherId !== null) {
      if (
        typeof navigator !== 'undefined' &&
        navigator.geolocation &&
        typeof this.watcherId === 'number'
      ) {
        navigator.geolocation.clearWatch(this.watcherId);
      } else {
        clearInterval(this.watcherId as NodeJS.Timeout);
      }
      this.watcherId = null;
    }
    this.isWatching = false;
  }

  /**
   * Get the last known location
   */
  getLastLocation(): UserLocation | null {
    return this.lastLocation;
  }

  /**
   * Check if location watching is active
   */
  getIsWatching(): boolean {
    return this.isWatching;
  }
}

export const locationService = new LocationService();
