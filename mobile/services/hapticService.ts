export type HapticType =
  | 'boardingApproach'
  | 'boardingArrival'
  | 'alightingApproach'
  | 'transfer'
  | 'destinationArrival'
  | 'offRoute';

export class HapticService {
  /**
   * Triggers a specific, intentional haptic pattern based on navigation event
   */
  trigger(type: HapticType): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        switch (type) {
          case 'boardingApproach':
            navigator.vibrate([100, 100, 100]);
            break;
          case 'boardingArrival':
            navigator.vibrate(250);
            break;
          case 'alightingApproach':
            navigator.vibrate([150, 100, 150, 100, 200]);
            break;
          case 'transfer':
            navigator.vibrate([120, 80, 120]);
            break;
          case 'destinationArrival':
            navigator.vibrate([200, 100, 200, 100, 400]);
            break;
          case 'offRoute':
            navigator.vibrate([300, 150, 300]);
            break;
          default:
            navigator.vibrate(100);
            break;
        }
      } catch {
        // Non-blocking fallback
      }
    }
  }

  cancel(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }
}

export const hapticService = new HapticService();
