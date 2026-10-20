/**
 * Observability setup (Phase 15).
 *
 * Call `setupObservability()` once at process start (e.g. from server.ts)
 * to register the default metric vocabulary with the shared metrics registry.
 * This keeps metrics.ts free of a circular import to vocabulary.ts.
 */
import { metrics } from "./metrics.js";
import { DEFAULT_METRICS } from "./vocabulary.js";

/** Register all default metric descriptors. Safe to call multiple times. */
export function setupObservability(): void {
  for (const d of DEFAULT_METRICS) {
    metrics.register(d);
  }
}
