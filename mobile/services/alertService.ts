import { AlertType, NavigationAlert } from '../navigation/navigationTypes';

export class AlertService {
  private triggeredAlerts: Map<string, NavigationAlert> = new Map();
  private alertListeners: ((alert: NavigationAlert) => void)[] = [];

  /**
   * Generates a unique key for deduplication per step and alert type
   */
  private makeAlertKey(stepIndex: number, type: AlertType): string {
    return `${stepIndex}_${type}`;
  }

  /**
   * Registers a listener for live alerts
   */
  subscribe(listener: (alert: NavigationAlert) => void): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Triggers an alert if it hasn't already fired for this step
   * Returns true if newly triggered, false if deduplicated
   */
  triggerAlert(
    stepIndex: number,
    type: AlertType,
    title: string,
    subtitle: string,
    mode?: string
  ): { isNew: boolean; alert: NavigationAlert } {
    const key = this.makeAlertKey(stepIndex, type);

    const existing = this.triggeredAlerts.get(key);
    if (existing) {
      return { isNew: false, alert: existing };
    }

    const alert: NavigationAlert = {
      id: `alert_${Date.now()}_${key}`,
      type,
      stepIndex,
      title,
      subtitle,
      mode,
      triggeredAt: Date.now(),
    };

    this.triggeredAlerts.set(key, alert);
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.warn('Error in alert listener:', err);
      }
    });

    return { isNew: true, alert };
  }

  /**
   * Clears triggered history when starting a fresh journey
   */
  reset(): void {
    this.triggeredAlerts.clear();
  }

  /**
   * Get all triggered alerts in chronological order
   */
  getHistory(): NavigationAlert[] {
    return Array.from(this.triggeredAlerts.values());
  }

  /**
   * Hydrates triggered history (for restored journeys)
   */
  restoreHistory(alerts: NavigationAlert[]): void {
    this.triggeredAlerts.clear();
    alerts.forEach((a) => {
      const key = this.makeAlertKey(a.stepIndex, a.type);
      this.triggeredAlerts.set(key, a);
    });
  }
}

export const alertService = new AlertService();
