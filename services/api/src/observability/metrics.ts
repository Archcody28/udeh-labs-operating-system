/**
 * Provider-neutral metrics registry (Phase 15).
 *
 * Design constraints:
 * - PROVIDER NEUTRAL: a plain in-process registry with an injectable
 *   exporter. No Prometheus/OpenTelemetry SDK dependency is introduced.
 * - BOUNDED CARDINALITY: every metric has a fixed label NAME set and a
 *   fixed label VALUE set. An unknown label value is folded into a
 *   placeholder bucket rather than creating a new time series. This is the
 *   single most important property: an unbounded label (raw URL, user id,
 *   correlation id) would be a memory-exhaustion vector.
 * - FAIL OPEN: recording a metric never throws.
 */
export const METRIC_PREFIX = "udehlabs_";

export type MetricType = "counter" | "gauge" | "histogram";

export interface MetricDescriptor {
  name: string;
  type: MetricType;
  help: string;
  /** Allowed label values. `null` means "unbounded-ish but bucketed". */
  labelValues: Record<string, readonly (string | null)[]>;
  /** Histogram bucket upper bounds (seconds for durations). */
  buckets?: number[];
}

export interface MetricSample {
  name: string;
  type: MetricType;
  help: string;
  labels: Record<string, string>;
  value: number;
  count?: number;
  sum?: number;
  buckets?: Record<string, number>;
}

const UNKNOWN = "unknown";

/** Collapse an out-of-vocabulary label value to a bounded placeholder. */
export function boundedValue(
  allowed: readonly (string | null)[] | undefined,
  value: string | undefined
): string {
  if (value === undefined || value === null || value === "") return UNKNOWN;
  if (!allowed) return UNKNOWN;
  if (allowed.includes(value)) return value;
  // `null` in the vocabulary means "other/unknown bucket".
  if (allowed.includes(null)) return UNKNOWN;
  return UNKNOWN;
}

function labelKey(labels: Record<string, string>): string {
  const keys = Object.keys(labels).sort();
  return keys.map((k) => `${k}=${labels[k]}`).join(",");
}

interface SeriesState {
  labels: Record<string, string>;
  value: number;
  count: number;
  sum: number;
  buckets: Record<string, number>;
}

export class MetricsRegistry {
  private readonly descriptors = new Map<string, MetricDescriptor>();
  /** Per-metric map of label-key -> series state. */
  private readonly series = new Map<string, Map<string, SeriesState>>();

  /** Register a metric. Re-registering the same name is a no-op. */
  register(descriptor: MetricDescriptor): void {
    if (this.descriptors.has(descriptor.name)) return;
    this.descriptors.set(descriptor.name, descriptor);
  }

  /**
   * Resolve (and lazily create) the series state for a metric + label set.
   * Returns null when the metric is unregistered.
   */
  private seriesFor(
    d: MetricDescriptor,
    labels: Record<string, string | undefined>
  ): { state: SeriesState; effective: Record<string, string> } | null {
    const effective = this.effectiveLabels(d, labels);
    let bucket = this.series.get(d.name);
    if (!bucket) {
      bucket = new Map<string, SeriesState>();
      this.series.set(d.name, bucket);
    }
    const key = labelKey(effective);
    let state = bucket.get(key);
    if (!state) {
      state = { labels: effective, value: 0, count: 0, sum: 0, buckets: {} };
      bucket.set(key, state);
    }
    return { state, effective };
  }

  /**
   * Record a counter increment. Unknown label values are bucketed.
   * Returns the effective label set that was recorded.
   */
  increment(
    name: string,
    labels: Record<string, string | undefined> = {},
    value = 1
  ): Record<string, string> {
    try {
      const d = this.descriptors.get(name);
      if (!d) return {};
      const found = this.seriesFor(d, labels);
      if (!found) return {};
      found.state.value += value;
      found.state.count += 1;
      found.state.sum += value;
      return found.effective;
    } catch {
      // FAIL OPEN
      return {};
    }
  }

  /** Record a gauge value. */
  set(name: string, value: number, labels: Record<string, string | undefined> = {}): void {
    try {
      const d = this.descriptors.get(name);
      if (!d) return;
      const found = this.seriesFor(d, labels);
      if (!found) return;
      found.state.value = value;
    } catch {
      // FAIL OPEN
    }
  }

  /** Observe a value (histogram). */
  observe(name: string, value: number, labels: Record<string, string | undefined> = {}): void {
    try {
      const d = this.descriptors.get(name);
      if (!d) return;
      const found = this.seriesFor(d, labels);
      if (!found) return;
      found.state.count += 1;
      found.state.sum += value;
      for (const b of d.buckets ?? []) {
        if (value <= b) {
          const k = String(b);
          found.state.buckets[k] = (found.state.buckets[k] ?? 0) + 1;
        }
      }
    } catch {
      // FAIL OPEN
    }
  }

  /** Snapshot every series (for a scrape endpoint or an exporter). */
  collect(): MetricSample[] {
    const out: MetricSample[] = [];
    for (const d of this.descriptors.values()) {
      const bucket = this.series.get(d.name);
      if (!bucket) continue;
      for (const state of bucket.values()) {
        out.push({
          name: d.name,
          type: d.type,
          help: d.help,
          labels: state.labels,
          value: state.value,
          count: state.count,
          sum: state.sum,
          buckets: state.buckets,
        });
      }
    }
    return out;
  }

  /** Number of distinct series currently held (cardinality guard). */
  seriesCount(): number {
    let n = 0;
    for (const bucket of this.series.values()) n += bucket.size;
    return n;
  }

  /** Remove all series (tests). */
  reset(): void {
    this.series.clear();
  }

  private effectiveLabels(
    d: MetricDescriptor,
    labels: Record<string, string | undefined>
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [label, allowed] of Object.entries(d.labelValues)) {
      out[label] = boundedValue(allowed, labels[label]);
    }
    // Labels not declared by the descriptor are DROPPED, never accepted:
    // an undeclared label is an unbounded-cardinality escape hatch.
    return out;
  }
}

/** Shared registry instance. Default metrics are registered via setup(). */
export const metrics = new MetricsRegistry();
