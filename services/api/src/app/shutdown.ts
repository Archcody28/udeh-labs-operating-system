/**
 * Graceful shutdown coordinator (Phase 16 reliability).
 *
 * A process that is killed mid-flight loses in-flight work, leaves
 * half-written state, and can strand database claims. This module gives the
 * process ONE deterministic exit path:
 *
 *   1. stop accepting new work (close the HTTP listener),
 *   2. let in-flight work finish (bounded by a deadline),
 *   3. release resources (database pool),
 *   4. exit - and exit FORCED if the deadline is exceeded, because a hung
 *      shutdown is worse than a truncated one: the orchestrator's kill
 *      timeout will kill the process anyway, but without our cleanup.
 *
 * The coordinator is idempotent: a second signal during shutdown escalates
 * to a forced exit instead of starting a second drain.
 */
import { Server } from "node:http";
import { log } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";

export interface ShutdownStep {
  /** Stable name for the step (logged, never a secret). */
  name: string;
  /** Perform the step. Must be idempotent. */
  run: () => Promise<void> | void;
}

export interface ShutdownOptions {
  /** Hard deadline for the whole drain, in milliseconds. */
  timeoutMs?: number;
  /** Called after every step completes (or the deadline is hit). */
  onExit?: (code: number) => void;
}

export interface ShutdownResult {
  /** Steps that completed successfully. */
  completed: string[];
  /** Steps that threw or were cut short by the deadline. */
  failed: string[];
  /** True when the deadline was exceeded (forced exit). */
  forced: boolean;
}

/**
 * Run the shutdown steps in order, bounded by a deadline.
 *
 * A step that throws is recorded and the sequence CONTINUES: one failing
 * resource must not prevent the others from being released.
 */
export async function runShutdown(
  steps: ShutdownStep[],
  opts: ShutdownOptions = {}
): Promise<ShutdownResult> {
  const timeoutMs = Math.max(opts.timeoutMs ?? 10_000, 100);
  const completed: string[] = [];
  const failed: string[] = [];

  let deadlineTimer: NodeJS.Timeout | undefined;
  const deadline = new Promise<"timeout">((resolve) => {
    deadlineTimer = setTimeout(() => resolve("timeout"), timeoutMs);
    // Not unref'd: the deadline is the ONLY thing that can end a hung
    // drain, so it must keep the event loop alive until it fires.
  });

  const drain = (async () => {
    for (const step of steps) {
      try {
        await step.run();
        completed.push(step.name);
      } catch (err) {
        failed.push(step.name);
        try {
          metrics.increment("udehlabs_shutdown_events_total", { result: "step_failed" });
        } catch {
          // FAIL OPEN
        }
        try {
          log.error("shutdown.step_failed", "shutdown step failed", {
            step: step.name,
            error_code: (err as { code?: string } | null)?.code ?? "unknown"
          });
        } catch {
          // FAIL OPEN
        }
      }
    }
  })();

  const outcome = await Promise.race([drain.then(() => "done" as const), deadline]);
  if (deadlineTimer) clearTimeout(deadlineTimer);
  const forced = outcome === "timeout";
  try {
    metrics.increment(
      "udehlabs_shutdown_events_total",
      { result: forced ? "forced" : "graceful" }
    );
  } catch {
    // FAIL OPEN
  }
  if (forced) {
    try {
      log.error("shutdown.timeout", "shutdown deadline exceeded; forcing exit", {
        timeout_ms: timeoutMs,
        completed: completed.length,
        failed: failed.length
      });
    } catch {
      // FAIL OPEN
    }
  }
  try {
    log.info("shutdown.complete", "shutdown sequence finished", {
      completed: completed.length,
      failed: failed.length,
      forced
    });
  } catch {
    // FAIL OPEN
  }
  return { completed, failed, forced };
}

/** Close an HTTP listener and resolve when it is no longer accepting connections. */
export function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close(() => resolve());
    // Idle keep-alive sockets would otherwise hold the listener open past
    // the shutdown deadline. Node 18.2+ exposes closeIdleConnections().
    const maybe = server as unknown as { closeIdleConnections?: () => void };
    if (typeof maybe.closeIdleConnections === "function") {
      try {
        maybe.closeIdleConnections();
      } catch {
        /* best effort */
      }
    }
  });
}

/**
 * Install SIGINT/SIGTERM handlers that run the shutdown sequence once.
 *
 * A second signal escalates to an immediate forced exit - an operator
 * repeating Ctrl-C wants out now.
 */
export function installSignalHandlers(
  steps: ShutdownStep[],
  opts: ShutdownOptions = {}
): () => void {
  let shuttingDown = false;
  const onSignal = (signal: string) => {
    if (shuttingDown) {
      try {
        log.error("shutdown.forced", "second signal received; forcing exit", { signal });
      } catch {
        /* best effort */
      }
      opts.onExit?.(1);
      return;
    }
    shuttingDown = true;
    try {
      log.info("shutdown.signal", "shutdown signal received", { signal });
    } catch {
      /* best effort */
    }
    void runShutdown(steps, opts).then((result) => {
      opts.onExit?.(result.forced ? 1 : 0);
    });
  };
  const sigint = () => onSignal("SIGINT");
  const sigterm = () => onSignal("SIGTERM");
  process.on("SIGINT", sigint);
  process.on("SIGTERM", sigterm);
  return () => {
    process.off("SIGINT", sigint);
    process.off("SIGTERM", sigterm);
  };
}
