/**
 * FpsMonitor
 * Measures frames per second using requestAnimationFrame.
 * Reports FPS via callback every ~1 second.
 */

export type FpsCallback = (fps: number) => void;

export class FpsMonitor {
  private callback: FpsCallback;
  private rafId: number | null = null;
  private frameCount = 0;
  private lastReportTime = 0;
  private running = false;

  constructor(callback: FpsCallback) {
    this.callback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.frameCount = 0;
    this.lastReportTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastReportTime;

    if (elapsed >= 1000) {
      const fps = (this.frameCount / elapsed) * 1000;
      this.callback(Math.round(fps));
      this.frameCount = 0;
      this.lastReportTime = now;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
