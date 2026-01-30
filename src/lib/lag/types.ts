/**
 * Lag Telemetry Types
 * Defines metrics, thresholds, and communication interfaces for lag monitoring.
 */

export type MetricName = 'ping' | 'fps' | 'inputLatency' | 'moveRtt';

export type MetricHealth = 'good' | 'degraded' | 'poor' | 'unknown';

/** Maximum number of historical samples to retain per metric */
export const MAX_HISTORY = 60;

export type MetricState = {
  /** EMA-smoothed value */
  value: number | null;
  /** Health classification based on thresholds */
  health: MetricHealth;
  /** Most recent raw sample */
  rawLatest: number | null;
  /** Total samples received */
  sampleCount: number;
  /** Timestamp of last update */
  lastUpdated: number;
  /** Rolling buffer of recent EMA values for sparkline rendering */
  history: number[];
};

export type LagMetrics = Record<MetricName, MetricState>;

export type MetricThresholds = {
  /** Upper bound for "good" health (lower bound for higherIsBetter) */
  good: number;
  /** Upper bound for "degraded" health (lower bound for higherIsBetter) */
  degraded: number;
  /** If true, higher values are better (e.g. FPS) */
  higherIsBetter: boolean;
};

/** Threshold definitions per metric */
export const METRIC_THRESHOLDS: Record<MetricName, MetricThresholds> = {
  ping: { good: 50, degraded: 150, higherIsBetter: false },
  fps: { good: 55, degraded: 30, higherIsBetter: true },
  inputLatency: { good: 50, degraded: 150, higherIsBetter: false },
  moveRtt: { good: 200, degraded: 500, higherIsBetter: false },
};

/** Display labels per metric */
export const METRIC_LABELS: Record<MetricName, string> = {
  ping: 'Ping',
  fps: 'FPS',
  inputLatency: 'Input',
  moveRtt: 'Move RTT',
};

/** Units per metric */
export const METRIC_UNITS: Record<MetricName, string> = {
  ping: 'ms',
  fps: '',
  inputLatency: 'ms',
  moveRtt: 'ms',
};

/** Colors for each health level */
export const HEALTH_COLORS: Record<MetricHealth, string> = {
  good: '#10b981',
  degraded: '#f59e0b',
  poor: '#ef4444',
  unknown: '#6b7280',
};

/** Message sent from page script to content script via CustomEvent */
export type PageScriptMessage = {
  type: 'ws-rtt';
  rtt: number;
  timestamp: number;
};
