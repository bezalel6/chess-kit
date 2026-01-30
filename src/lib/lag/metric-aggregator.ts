/**
 * MetricAggregator
 * Aggregates raw metric samples using Exponential Moving Average (EMA)
 * and evaluates health per metric against defined thresholds.
 * Maintains a rolling history buffer per metric for sparkline rendering.
 */

import {
  MetricName,
  MetricHealth,
  MetricState,
  LagMetrics,
  METRIC_THRESHOLDS,
  MAX_HISTORY,
} from './types';

const EMA_ALPHA = 0.3;

const ALL_METRICS: MetricName[] = ['ping', 'fps', 'inputLatency', 'moveRtt'];

function createEmptyState(): MetricState {
  return {
    value: null,
    health: 'unknown',
    rawLatest: null,
    sampleCount: 0,
    lastUpdated: 0,
    history: [],
  };
}

function evaluateHealth(name: MetricName, value: number): MetricHealth {
  const t = METRIC_THRESHOLDS[name];

  if (t.higherIsBetter) {
    if (value >= t.good) return 'good';
    if (value >= t.degraded) return 'degraded';
    return 'poor';
  } else {
    if (value <= t.good) return 'good';
    if (value <= t.degraded) return 'degraded';
    return 'poor';
  }
}

export class MetricAggregator {
  private metrics: LagMetrics;

  constructor() {
    this.metrics = {} as LagMetrics;
    for (const name of ALL_METRICS) {
      this.metrics[name] = createEmptyState();
    }
  }

  /** Add a raw sample for a given metric */
  addSample(name: MetricName, value: number): void {
    const state = this.metrics[name];
    const now = Date.now();

    if (state.value === null) {
      state.value = value;
    } else {
      state.value = EMA_ALPHA * value + (1 - EMA_ALPHA) * state.value;
    }

    state.rawLatest = value;
    state.sampleCount++;
    state.lastUpdated = now;
    state.health = evaluateHealth(name, state.value);

    // Append to rolling history buffer
    state.history.push(state.value);
    if (state.history.length > MAX_HISTORY) {
      state.history.shift();
    }
  }

  /** Get current state of all metrics */
  getMetrics(): LagMetrics {
    return { ...this.metrics };
  }

  /** Get overall health (worst of all metrics that have data) */
  getOverallHealth(): MetricHealth {
    const healthPriority: MetricHealth[] = ['poor', 'degraded', 'good'];

    for (const health of healthPriority) {
      for (const name of ALL_METRICS) {
        if (this.metrics[name].health === health) {
          return health;
        }
      }
    }

    return 'unknown';
  }

  /** Reset all metrics to initial state */
  reset(): void {
    for (const name of ALL_METRICS) {
      this.metrics[name] = createEmptyState();
    }
  }
}
