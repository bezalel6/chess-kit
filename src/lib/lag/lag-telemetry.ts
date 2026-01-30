/**
 * LagTelemetry
 * Facade class that orchestrates all lag monitoring components.
 * Single entry point for the content script to start/stop telemetry.
 */

import { PageScriptMessage } from './types';
import { MetricAggregator } from './metric-aggregator';
import { FpsMonitor } from './fps-monitor';
import { PingMonitor } from './ping-monitor';
import { InputMonitor } from './input-monitor';
import { LagOverlay } from './lag-overlay';

const UPDATE_INTERVAL_MS = 1000;
const WS_EVENT_NAME = 'chess-kit-ws-data';

export class LagTelemetry {
  private aggregator: MetricAggregator;
  private fpsMonitor: FpsMonitor;
  private pingMonitor: PingMonitor;
  private inputMonitor: InputMonitor;
  private overlay: LagOverlay;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private pageScriptInjected = false;

  constructor() {
    this.aggregator = new MetricAggregator();

    this.fpsMonitor = new FpsMonitor((fps) => {
      this.aggregator.addSample('fps', fps);
    });

    this.pingMonitor = new PingMonitor((ping) => {
      this.aggregator.addSample('ping', ping);
    });

    this.inputMonitor = new InputMonitor((latency) => {
      this.aggregator.addSample('inputLatency', latency);
    });

    this.overlay = new LagOverlay();
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Inject page script for WebSocket interception
    this.injectPageScript();

    // Listen for messages from page script
    document.addEventListener(WS_EVENT_NAME, this.onWsEvent as EventListener);

    // Start all monitors
    this.fpsMonitor.start();
    this.pingMonitor.start();
    this.inputMonitor.start();

    // Create overlay
    this.overlay.create();

    // Update overlay periodically
    this.updateInterval = setInterval(() => {
      const metrics = this.aggregator.getMetrics();
      this.overlay.update(metrics);
    }, UPDATE_INTERVAL_MS);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    // Stop all monitors
    this.fpsMonitor.stop();
    this.pingMonitor.stop();
    this.inputMonitor.stop();

    // Stop listening for page script events
    document.removeEventListener(WS_EVENT_NAME, this.onWsEvent as EventListener);

    // Clear update interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Remove overlay
    this.overlay.remove();

    // Reset aggregator
    this.aggregator.reset();
  }

  getIsRunning(): boolean {
    return this.running;
  }

  private onWsEvent = (e: Event): void => {
    const detail = (e as CustomEvent<PageScriptMessage>).detail;
    if (detail && detail.type === 'ws-rtt' && typeof detail.rtt === 'number') {
      this.aggregator.addSample('moveRtt', detail.rtt);
    }
  };

  private injectPageScript(): void {
    if (this.pageScriptInjected) return;

    // Build the URL to the page script bundled as a web-accessible resource
    const scriptUrl = chrome.runtime.getURL('js/lag_page_script.js');

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = () => {
      script.remove(); // Clean up the injector tag
    };

    (document.head || document.documentElement).appendChild(script);
    this.pageScriptInjected = true;
  }
}
