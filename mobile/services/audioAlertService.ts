export type SoundEffectType = 'boarding' | 'alighting' | 'transfer' | 'arrival' | 'offroute';

export class AudioAlertService {
  private isEnabled = true;

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Plays a non-blocking chime / tone for navigation events.
   * If audio assets are unavailable or in simulator/test mode, executes gracefully without crashing.
   */
  async playAlert(type: SoundEffectType): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // In web/browser environments with Web Audio API available
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          // Customize frequency based on alert type
          if (type === 'alighting' || type === 'offroute') {
            osc.frequency.setValueAtTime(880, ctx.currentTime); // High A5 tone
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } else if (type === 'arrival') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 -> E5 -> G5 chime
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          } else {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }
}

export const audioAlertService = new AudioAlertService();
