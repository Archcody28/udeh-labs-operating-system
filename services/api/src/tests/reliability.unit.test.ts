/**
 * Phase 16 unit tests: reliability, resilience and disaster-recovery
 * hardening with NO database.
 *
 * Covers:
 * - bounded execution (timeouts, retry classification, backoff),
 * - graceful shutdown sequencing (ordering, failure isolation, deadline),
 * - database error classification (transient vs terminal),
 * - configuration clamping for the new operational knobs,
 * - metric vocabulary integrity for the Phase 16 metrics.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withTimeout, withRetry, TimeoutError } from "../domain/timeout.js";
import { isRetryableDbError, withDbRetry, queryWithTimeout } from "../persistence/db.js";
import { runShutdown, closeServer } from "../app/shutdown.js";
import { loadConfig } from "../config.js";
import { metrics } from "../observability/metrics.js";
import { setupObservability } from "../observability/setup.js";
import { DEFAULT_METRICS } from "../observability/vocabulary.js";

describe("phase16 bounded execution", () => {
  it("resolves when the operation completes in time", async () => {
    const value = await withTimeout(async () => "ok", 1_000, "fast");
    assert.equal(value, "ok");
  });

  it("rejects with TimeoutError when the operation exceeds its deadline", async () => {
    await assert.rejects(
      () => withTimeout(() => new Promise<never>(() => { /* never settles */ }), 25, "hung"),
      (err: unknown) => {
        assert.ok(err instanceof TimeoutError);
        assert.equal((err as TimeoutError).operation, "hung");
        assert.equal((err as TimeoutError).timeoutMs, 25);
        return true;
      }
    );
  });

  it("never resolves with a fabricated value when the deadline is hit", async () => {
    // The contract is REJECT, not resolve-with-fallback: a caller must never
    // mistake a timeout for success.
    const outcome = await withTimeout(
      () => new Promise<never>(() => { /* never settles */ }),
      20,
      "hung"
    ).then(() => "resolved", () => "rejected");
    assert.equal(outcome, "rejected");
  });

  it("aborts the signal when the deadline is hit", async () => {
    let aborted = false;
    await assert.rejects(() =>
      withTimeout((signal) => {
        signal.addEventListener("abort", () => { aborted = true; });
        return new Promise<never>(() => { /* never settles */ });
      }, 20, "hung")
    );
    assert.equal(aborted, true, "the abort signal must fire on timeout");
  });

  it("retries a retryable failure and eventually succeeds", async () => {
    let calls = 0;
    const value = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("transient");
        return calls;
      },
      { attempts: 5, baseDelayMs: 1, maxDelayMs: 2 }
    );
    assert.equal(value, 3);
  });

  it("does not retry a terminal failure", async () => {
    let calls = 0;
    await assert.rejects(() =>
      withRetry(
        async () => {
          calls += 1;
          throw new Error("terminal");
        },
        { attempts: 5, baseDelayMs: 1, isRetryable: () => false }
      )
    );
    assert.equal(calls, 1, "a non-retryable failure must fail on the first attempt");
  });

  it("stops after the attempt budget is exhausted", async () => {
    let calls = 0;
    await assert.rejects(() =>
      withRetry(
        async () => {
          calls += 1;
          throw new Error("transient");
        },
        { attempts: 3, baseDelayMs: 1 }
      )
    );
    assert.equal(calls, 3);
  });
});

describe("phase16 database failure classification", () => {

describe("phase16 database retry helper", () => {
  it("retries a transient failure and then succeeds", async () => {
    let calls = 0;
    const value = await withDbRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw Object.assign(new Error("connection terminated"), { code: "08006" });
        return "ok";
      },
      { attempts: 5, baseDelayMs: 1, maxDelayMs: 2 }
    );
    assert.equal(value, "ok");
    assert.equal(calls, 3);
  });

  it("does not retry a terminal failure", async () => {
    let calls = 0;
    await assert.rejects(() =>
      withDbRetry(
        async () => {
          calls += 1;
          throw Object.assign(new Error("duplicate key"), { code: "23505" });
        },
        { attempts: 5, baseDelayMs: 1 }
      )
    );
    assert.equal(calls, 1, "a constraint violation must not be retried");
  });

  it("gives up after the attempt budget is exhausted", async () => {
    let calls = 0;
    await assert.rejects(() =>
      withDbRetry(
        async () => {
          calls += 1;
          throw Object.assign(new Error("connection terminated"), { code: "08006" });
        },
        { attempts: 2, baseDelayMs: 1 }
      )
    );
    assert.equal(calls, 2);
  });

  it("times out a query that overruns its deadline", async () => {
    const runner = {
      query: () => new Promise<never>(() => { /* never settles */ })
    } as never;
    await assert.rejects(
      () => queryWithTimeout(runner, "SELECT 1", [], 25),
      /timeout after 25ms/
    );
  });

  it("returns the result of a query that completes in time", async () => {
    const runner = {
      query: async () => ({ rowCount: 1, rows: [{ ok: 1 }] })
    } as never;
    const res = await queryWithTimeout(runner, "SELECT 1", [], 1_000);
    assert.equal(res.rowCount, 1);
  });
});

  it("classifies transient connection failures as retryable", () => {
    assert.equal(isRetryableDbError({ code: "08006" }), true);
    assert.equal(isRetryableDbError({ code: "57P01" }), true);
    assert.equal(isRetryableDbError({ code: "53300" }), true);
    assert.equal(isRetryableDbError({ message: "Connection terminated unexpectedly" }), true);
    assert.equal(isRetryableDbError({ message: "timeout exceeded" }), true);
  });

  it("classifies constraint and syntax failures as terminal", () => {
    assert.equal(isRetryableDbError({ code: "23505" }), false);
    assert.equal(isRetryableDbError({ code: "23503" }), false);
    assert.equal(isRetryableDbError({ code: "42601" }), false);
    assert.equal(isRetryableDbError(new Error("unique constraint violated")), false);
  });

  it("never throws for a null or malformed error", () => {
    assert.equal(isRetryableDbError(null), false);
    assert.equal(isRetryableDbError(undefined), false);
    assert.equal(isRetryableDbError({}), false);
  });
});

describe("phase16 graceful shutdown", () => {
  it("runs the steps in order", async () => {
    const order: string[] = [];
    const result = await runShutdown([
      { name: "a", run: () => { order.push("a"); } },
      { name: "b", run: () => { order.push("b"); } },
      { name: "c", run: () => { order.push("c"); } }
    ]);
    assert.deepEqual(order, ["a", "b", "c"]);
    assert.deepEqual(result.completed, ["a", "b", "c"]);
    assert.equal(result.forced, false);
  });

  it("continues after a failing step and records the failure", async () => {
    const ran: string[] = [];
    const result = await runShutdown([
      {
        name: "boom",
        run: () => {
          ran.push("boom");
          throw new Error("release failed");
        }
      },
      { name: "after", run: () => { ran.push("after"); } }
    ]);
    assert.deepEqual(ran, ["boom", "after"], "a failing step must not skip the rest");
    assert.deepEqual(result.failed, ["boom"]);
    assert.deepEqual(result.completed, ["after"]);
  });

  it("forces the exit when the deadline is exceeded", async () => {
    const result = await runShutdown(
      [
        {
          name: "hangs",
          run: () => new Promise<void>(() => { /* never settles */ })
        }
      ],
      { timeoutMs: 100 }
    );
    assert.equal(result.forced, true, "a hung drain must be reported as forced");
  });

  it("resolves closeServer immediately when the server is not listening", async () => {
    const fake = { listening: false } as never;
    await closeServer(fake);
  });

  it("stops accepting new connections once the listener is closed", async () => {
    // A real server (not a mock): after `closeServer` the port must refuse
    // connections, otherwise the orchestrator keeps routing traffic to a
    // process that is draining.
    const { createServer } = await import("node:http");
    const server = createServer((_req, res) => { res.end("ok"); });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port;

    const before = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(before.status, 200, "the server must serve before the drain");

    await closeServer(server);
    await assert.rejects(
      () => fetch(`http://127.0.0.1:${port}/`),
      "the listener must be closed after the drain"
    );
  });

  it("drains an in-flight request before the listener is closed", async () => {
    // The drain must let work that is already running finish: closing the
    // listener stops NEW work, it must not truncate work in progress.
    const { createServer } = await import("node:http");
    let release: (() => void) | undefined;
    const gate = new Promise<void>((r) => { release = r; });
    const server = createServer(async (_req, res) => {
      await gate;
      res.end("done");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port;

    const inFlight = fetch(`http://127.0.0.1:${port}/`);
    // Give the request a moment to reach the handler.
    await new Promise((r) => setTimeout(r, 50));
    const closed = closeServer(server);
    release?.();
    const res = await inFlight;
    assert.equal(res.status, 200, "the in-flight request must complete");
    assert.equal(await res.text(), "done");
    await closed;
  });
});

describe("phase16 operational configuration", () => {
  const saved = {
    providerTimeout: process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS,
    shutdown: process.env.SHUTDOWN_TIMEOUT_MS,
    readiness: process.env.READINESS_TIMEOUT_MS,
    lease: process.env.NOTIFICATION_LEASE_MS
  };
  const restore = (): void => {
    for (const [k, v] of [
      ["NOTIFICATION_PROVIDER_TIMEOUT_MS", saved.providerTimeout],
      ["SHUTDOWN_TIMEOUT_MS", saved.shutdown],
      ["READINESS_TIMEOUT_MS", saved.readiness],
      ["NOTIFICATION_LEASE_MS", saved.lease]
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };

  it("defaults the reliability knobs to bounded values", () => {
    delete process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS;
    delete process.env.SHUTDOWN_TIMEOUT_MS;
    delete process.env.READINESS_TIMEOUT_MS;
    delete process.env.NOTIFICATION_LEASE_MS;
    const cfg = loadConfig();
    assert.equal(cfg.notificationWorker.providerTimeoutMs, 10_000);
    assert.equal(cfg.shutdownTimeoutMs, 10_000);
    assert.equal(cfg.readinessTimeoutMs, 2_000);
    assert.equal(cfg.notificationWorker.leaseMs, 60_000);
    restore();
  });

  it("clamps out-of-range operator values instead of trusting them", () => {
    process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS = "1";
    process.env.SHUTDOWN_TIMEOUT_MS = "999999999";
    process.env.READINESS_TIMEOUT_MS = "not-a-number";
    const cfg = loadConfig();
    assert.equal(cfg.notificationWorker.providerTimeoutMs, 100);
    assert.equal(cfg.shutdownTimeoutMs, 300_000);
    assert.equal(cfg.readinessTimeoutMs, 2_000);
    restore();
  });

  it("keeps the provider deadline strictly inside the claim lease", () => {
    // A provider call that outlives the lease lets a second worker re-claim
    // the same delivery row and send the notification TWICE.
    process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS = "600000";
    process.env.NOTIFICATION_LEASE_MS = "1000";
    const cfg = loadConfig();
    assert.ok(
      cfg.notificationWorker.providerTimeoutMs < cfg.notificationWorker.leaseMs,
      `provider deadline (${cfg.notificationWorker.providerTimeoutMs}ms) must be shorter ` +
        `than the lease (${cfg.notificationWorker.leaseMs}ms)`
    );
    restore();
  });

  it("stretches the lease when the operator asks for a long provider deadline", () => {
    process.env.NOTIFICATION_PROVIDER_TIMEOUT_MS = "120000";
    process.env.NOTIFICATION_LEASE_MS = "1000";
    const cfg = loadConfig();
    assert.ok(cfg.notificationWorker.leaseMs >= cfg.notificationWorker.providerTimeoutMs * 2);
    restore();
  });
});

describe("phase16 metric vocabulary", () => {
  it("declares every Phase 16 metric with a closed label vocabulary", () => {
    setupObservability();
    const names = DEFAULT_METRICS.map((m) => m.name);
    for (const expected of [
      "udehlabs_notification_provider_timeouts_total",
      "udehlabs_notification_recovered_claims_total",
      "udehlabs_db_retries_total",
      "udehlabs_shutdown_events_total"
    ]) {
      assert.ok(names.includes(expected), `missing metric descriptor: ${expected}`);
    }
  });

  it("records the recovery outcome on the worker tick counter", () => {
    setupObservability();
    metrics.reset();
    metrics.increment("udehlabs_notification_worker_ticks_total", { result: "recovery" });
    const samples = metrics.collect().filter(
      (s) => s.name === "udehlabs_notification_worker_ticks_total"
    );
    assert.equal(samples.length, 1);
    assert.equal(samples[0].labels.result, "recovery");
    assert.equal(samples[0].value, 1);
  });

  it("folds an undeclared label value into the bounded bucket", () => {
    setupObservability();
    metrics.reset();
    metrics.increment("udehlabs_notification_worker_ticks_total", { result: "startup_recovery" });
    const samples = metrics.collect().filter(
      (s) => s.name === "udehlabs_notification_worker_ticks_total"
    );
    assert.equal(samples.length, 1);
    assert.equal(samples[0].labels.result, "unknown");
  });
});
