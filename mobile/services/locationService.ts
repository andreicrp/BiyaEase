import { UserLocation } from '../types/journey.types';

export type LocationCallback = (location: UserLocation) => void;
export type LocationErrorCallback = (error: string) => void;

class LocationService {
  private watcherId: number | NodeJS.Timeout | null = null;
  private isWatching = false;
  private lastLocation: UserLocation | null = null;
  private customOriginName: string = 'UP Diliman, Quezon City';

  /**
   * Set custom location (editing current origin)
   */
  setCustomLocation(lat: number, lng: number, name?: string): UserLocation {
    const loc: UserLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    };
    this.lastLocation = loc;
    if (name) {
      this.customOriginName = name;
    }
    return loc;
  }

  /**
   * Get location display name
   */
  getLocationName(): string {
    return this.customOriginName;
  }

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
   * Request location permission and retrieve current device GPS coordinates
   */
  async requestPermission(): Promise<{ granted: boolean; location: UserLocation | null }> {
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
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
                resolve({ granted: true, location: loc });
              } else {
                resolve({ granted: true, location: null });
              }
            },
            (_err) => {
              // Permission denied or timeout - return default fallback
              const fallback: UserLocation = {
                latitude: 14.6538,
                longitude: 121.0685,
                accuracy: 10,
                timestamp: new Date().toISOString(),
              };
              this.lastLocation = fallback;
              resolve({ granted: true, location: fallback });
            },
            {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 8000,
            }
          );
        });
      }

      const defaultLoc: UserLocation = {
        latitude: 14.6538,
        longitude: 121.0685,
        accuracy: 10,
        timestamp: new Date().toISOString(),
      };
      this.lastLocation = defaultLoc;
      return { granted: true, location: defaultLoc };
    } catch {
      return { granted: false, location: null };
    }
  }

  /**
   * Get current position as a Promise
   */
  async getCurrentLocation(): Promise<UserLocation | null> {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = this.normalizeLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            });
            if (loc) this.lastLocation = loc;
            resolve(loc);
          },
          () => {
            resolve(this.lastLocation);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
      });
    }
    return this.lastLocation;
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
