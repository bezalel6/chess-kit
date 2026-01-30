/**
 * PingMonitor
 * Measures network latency using fetch HEAD requests to the current origin.
 * Reports ping RTT via callback every 5 seconds.
 */

export type PingCallback = (pingMs: number) => void;

const PING_INTERVAL_MS = 5000;

export class PingMonitor {
  private callback: PingCallback;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(callback: PingCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Immediate first measurement
    this.measure();

    this.intervalId = setInterval(() => {
      this.measure();
    }, PING_INTERVAL_MS);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async measure(): Promise<void> {
    if (!this.running) return;

    try {
      const start = performance.now();
      await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
      });
      const end = performance.now();
      const rtt = end - start;
      this.callback(Math.round(rtt));
    } catch {
      // Network error — skip this sample
    }
  }
}
