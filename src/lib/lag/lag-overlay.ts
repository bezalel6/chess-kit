/**
 * LagOverlay
 * Pure DOM overlay that displays lag telemetry metrics with SVG sparklines.
 * Fixed position bottom-right, collapsible, color-coded per metric.
 */

import {
  LagMetrics,
  MetricName,
  MetricHealth,
  MetricState,
  METRIC_LABELS,
  METRIC_UNITS,
  HEALTH_COLORS,
  METRIC_THRESHOLDS,
} from './types';

const OVERLAY_ID = 'chess-kit-lag-overlay';
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPARK_WIDTH = 80;
const SPARK_HEIGHT = 22;
const ALL_METRICS: MetricName[] = ['ping', 'fps', 'inputLatency', 'moveRtt'];

type MetricRowElements = {
  dot: HTMLElement;
  value: HTMLElement;
  sparkSvg: SVGSVGElement;
  sparkLine: SVGPolylineElement;
  sparkFill: SVGPolylineElement;
};

export class LagOverlay {
  private container: HTMLElement | null = null;
  private body: HTMLElement | null = null;
  private collapsed = false;
  private collapseBtn: HTMLElement | null = null;
  private metricRows: Map<MetricName, MetricRowElements> = new Map();

  create(): void {
    this.remove();

    this.container = document.createElement('div');
    this.container.id = OVERLAY_ID;
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      zIndex: '999998',
      background: 'rgba(15, 23, 42, 0.92)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
      fontFamily: '"Fira Code", "Courier New", monospace',
      fontSize: '11px',
      color: '#e2e8f0',
      minWidth: '260px',
      overflow: 'hidden',
      userSelect: 'none',
      transition: 'opacity 0.2s ease',
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      cursor: 'pointer',
    });

    const title = document.createElement('span');
    title.textContent = 'Lag Telemetry';
    Object.assign(title.style, {
      fontWeight: '600',
      fontSize: '11px',
      color: '#fbbf24',
      letterSpacing: '0.3px',
    });

    this.collapseBtn = document.createElement('span');
    this.updateCollapseIcon();
    Object.assign(this.collapseBtn.style, {
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.5)',
      marginLeft: '8px',
    });

    header.appendChild(title);
    header.appendChild(this.collapseBtn);
    header.addEventListener('click', () => this.toggleCollapse());

    // Body
    this.body = document.createElement('div');
    Object.assign(this.body.style, {
      padding: '6px 10px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    });

    // Metric rows
    for (const name of ALL_METRICS) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: '1.4',
      });

      // Health dot
      const dot = document.createElement('span');
      Object.assign(dot.style, {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: HEALTH_COLORS.unknown,
        flexShrink: '0',
        transition: 'background 0.3s ease',
      });

      // Label
      const label = document.createElement('span');
      label.textContent = METRIC_LABELS[name];
      Object.assign(label.style, {
        width: '52px',
        flexShrink: '0',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '11px',
      });

      // Sparkline SVG
      const { svg, line, fill } = this.createSparklineSvg();

      // Value
      const value = document.createElement('span');
      value.textContent = 'N/A';
      Object.assign(value.style, {
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        minWidth: '48px',
        color: '#e2e8f0',
        fontSize: '11px',
      });

      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(svg);
      row.appendChild(value);
      this.body.appendChild(row);

      this.metricRows.set(name, { dot, value, sparkSvg: svg, sparkLine: line, sparkFill: fill });
    }

    this.container.appendChild(header);
    this.container.appendChild(this.body);
    document.body.appendChild(this.container);
  }

  update(metrics: LagMetrics): void {
    for (const name of ALL_METRICS) {
      const state = metrics[name];
      const row = this.metricRows.get(name);
      if (!row) continue;

      row.dot.style.background = HEALTH_COLORS[state.health];

      if (state.value !== null) {
        const unit = METRIC_UNITS[name];
        const display = Math.round(state.value);
        row.value.textContent = unit ? `${display}${unit}` : `${display}`;
        row.value.style.color = this.getValueColor(state.health);
      } else {
        row.value.textContent = 'N/A';
        row.value.style.color = '#6b7280';
      }

      // Update sparkline
      this.updateSparkline(name, state, row);
    }
  }

  remove(): void {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    this.container = null;
    this.body = null;
    this.collapseBtn = null;
    this.metricRows.clear();
    this.collapsed = false;
  }

  // --- Private helpers ---

  private createSparklineSvg(): {
    svg: SVGSVGElement;
    line: SVGPolylineElement;
    fill: SVGPolylineElement;
  } {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(SPARK_WIDTH));
    svg.setAttribute('height', String(SPARK_HEIGHT));
    svg.setAttribute('viewBox', `0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`);
    svg.style.flexShrink = '0';
    svg.style.overflow = 'visible';

    // Filled area under the line (subtle gradient effect)
    const fill = document.createElementNS(SVG_NS, 'polyline');
    fill.setAttribute('fill', 'rgba(255,255,255,0.06)');
    fill.setAttribute('stroke', 'none');
    fill.setAttribute('points', '');

    // Main line
    const line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', HEALTH_COLORS.unknown);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('points', '');

    svg.appendChild(fill);
    svg.appendChild(line);

    return { svg, line, fill };
  }

  private updateSparkline(name: MetricName, state: MetricState, row: MetricRowElements): void {
    const { history } = state;
    if (history.length < 2) {
      row.sparkLine.setAttribute('points', '');
      row.sparkFill.setAttribute('points', '');
      return;
    }

    // Determine Y-axis range from thresholds to keep scale meaningful
    const thresholds = METRIC_THRESHOLDS[name];
    const ceiling = thresholds.higherIsBetter
      ? Math.max(thresholds.good * 1.3, ...history)
      : Math.max(thresholds.degraded * 1.5, ...history);
    const floor = thresholds.higherIsBetter
      ? Math.min(0, ...history)
      : 0;
    const range = ceiling - floor || 1;

    // Build polyline points
    const points: string[] = [];
    const step = SPARK_WIDTH / (history.length - 1);
    const padding = 2; // top/bottom padding in px
    const drawHeight = SPARK_HEIGHT - padding * 2;

    for (let i = 0; i < history.length; i++) {
      const x = i * step;
      const normalized = (history[i] - floor) / range;
      // For "higher is better" (FPS), high values should be at top
      // For "lower is better" (ping), low values should be at top
      const yRatio = thresholds.higherIsBetter ? 1 - normalized : normalized;
      const y = padding + yRatio * drawHeight;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const linePoints = points.join(' ');
    row.sparkLine.setAttribute('points', linePoints);

    // Fill: close the polygon along the bottom edge
    const fillPoints =
      `0,${SPARK_HEIGHT} ` + linePoints + ` ${((history.length - 1) * step).toFixed(1)},${SPARK_HEIGHT}`;
    row.sparkFill.setAttribute('points', fillPoints);

    // Color the line based on current health
    const color = HEALTH_COLORS[state.health];
    row.sparkLine.setAttribute('stroke', color);
    row.sparkFill.setAttribute('fill', this.getSparkFillColor(state.health));
  }

  private toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    if (this.body) {
      this.body.style.display = this.collapsed ? 'none' : 'flex';
    }
    this.updateCollapseIcon();
  }

  private updateCollapseIcon(): void {
    if (this.collapseBtn) {
      this.collapseBtn.textContent = this.collapsed ? '\u25B6' : '\u25BC';
    }
  }

  private getValueColor(health: MetricHealth): string {
    switch (health) {
      case 'good':
        return '#6ee7b7';
      case 'degraded':
        return '#fcd34d';
      case 'poor':
        return '#fca5a5';
      default:
        return '#e2e8f0';
    }
  }

  private getSparkFillColor(health: MetricHealth): string {
    switch (health) {
      case 'good':
        return 'rgba(16, 185, 129, 0.12)';
      case 'degraded':
        return 'rgba(245, 158, 11, 0.12)';
      case 'poor':
        return 'rgba(239, 68, 68, 0.12)';
      default:
        return 'rgba(255, 255, 255, 0.06)';
    }
  }
}
