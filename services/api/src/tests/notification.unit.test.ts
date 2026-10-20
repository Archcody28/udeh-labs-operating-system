/**
 * Phase 14 unit tests: notification domain logic with NO database.
 * Covers routing, template safety, retry/backoff determinism, provider
 * taxonomy, recipient candidate extraction, and event payload validation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { routeFor, EVENT_ROUTES } from "../domain/notificationRouting.js";
import { renderNotification, renderTemplate, sanitizeTemplateValue, escapeHtml } from "../domain/notificationTemplates.js";
import {
  backoffDelayMs, shouldRetry, deterministicJitter, DEFAULT_RETRY_POLICY,
} from "../domain/notificationRetry.js";
import {
  NotifyProviderError, isRetryableFailure, providerForChannel, registerNotificationProvider,
  setChannelDefault, clearNotificationProvidersForTests, NOTIFY_FAILURES,
} from "../domain/notificationProvider.js";
import { candidateUserIds } from "../domain/notificationRecipients.js";
import { canonicalJson, dedupeKeyFor, DOMAIN_EVENT_TYPES, DOMAIN_EVENT_SPECS } from "../domain/domainEvents.js";
import { ScriptedProvider } from "../domain/notificationProviders/scriptedProvider.js";
import { InAppProvider } from "../domain/notificationProviders/inAppProvider.js";
import { isNotificationChannel } from "../domain/notificationChannels.js";
import { canRoleInOrg } from "../domain/authorization.js";
import { loadConfig } from "../config.js";

describe("notification worker configuration", () => {
  const saved = {
    enabled: process.env.NOTIFICATION_WORKER_ENABLED,
    interval: process.env.NOTIFICATION_WORKER_INTERVAL_MS,
    batch: process.env.NOTIFICATION_WORKER_BATCH_SIZE,
  };
  const restore = (): void => {
    for (const [k, v] of [
      ["NOTIFICATION_WORKER_ENABLED", saved.enabled],
      ["NOTIFICATION_WORKER_INTERVAL_MS", saved.interval],
      ["NOTIFICATION_WORKER_BATCH_SIZE", saved.batch],
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };

  it("defaults to an enabled worker with bounded defaults", () => {
    delete process.env.NOTIFICATION_WORKER_ENABLED;
    delete process.env.NOTIFICATION_WORKER_INTERVAL_MS;
    delete process.env.NOTIFICATION_WORKER_BATCH_SIZE;
    const w = loadConfig().notificationWorker;
    assert.equal(w.enabled, true);
    assert.equal(w.intervalMs, 1_000);
    assert.equal(w.batchSize, 25);
    restore();
  });

  it("honours an explicit disable so the dispatcher can run separately", () => {
    process.env.NOTIFICATION_WORKER_ENABLED = "false";
    assert.equal(loadConfig().notificationWorker.enabled, false);
    restore();
  });

  it("clamps out-of-range operator values instead of trusting them", () => {
    process.env.NOTIFICATION_WORKER_INTERVAL_MS = "1";
    process.env.NOTIFICATION_WORKER_BATCH_SIZE = "100000";
    const w = loadConfig().notificationWorker;
    assert.equal(w.intervalMs, 50);
    assert.equal(w.batchSize, 100);
    restore();
  });

  it("ignores non-numeric operator values and keeps the defaults", () => {
    process.env.NOTIFICATION_WORKER_INTERVAL_MS = "not-a-number";
    process.env.NOTIFICATION_WORKER_BATCH_SIZE = "";
    const w = loadConfig().notificationWorker;
    assert.equal(w.intervalMs, 1_000);
    assert.equal(w.batchSize, 25);
    restore();
  });
});

describe("notification routing", () => {
  it("routes every canonical event type explicitly (no wildcard defaults)", () => {
    for (const t of DOMAIN_EVENT_TYPES) {
      const r = routeFor(t);
      assert.ok(r, `expected an explicit route for ${t}`);
      assert.equal(r!.eventType, t);
    }
  });

  it("returns null for an unknown event type", () => {
    assert.equal(routeFor("not.a.real.event"), null);
  });

  it("marks billing payment failure as mandatory (cannot be silenced)", () => {
    const r = EVENT_ROUTES["billing.payment.failed"];
    assert.equal(r?.mandatory, true);
    assert.equal(r?.recipients.kind, "org_permission");
  });

  it("uses a distinct route for every event type (no shared object aliasing)", () => {
    const seen = new Set<unknown>();
    for (const t of DOMAIN_EVENT_TYPES) {
      const r = routeFor(t);
      assert.ok(r);
      assert.equal(seen.has(r), false, `route object reused for ${t}`);
      seen.add(r);
    }
  });

describe("notification templates", () => {
  it("escapes HTML in interpolated values", () => {
    assert.equal(escapeHtml("<script>alert(1)</script>"),
      "&lt;script&gt;alert(1)&lt;&#47;script&gt;");
  });

  it("escapes braces so a value can never re-enter the template grammar", () => {
    assert.equal(escapeHtml("{x}"), "&#123;x&#125;");
  });

  it("renders unknown placeholders as empty (no context leakage)", () => {
    assert.equal(renderTemplate("Hi {{unknownKey}}", { other: "x" }), "Hi ");
  });

  it("strips control characters (header injection defense)", () => {
    const out = sanitizeTemplateValue("a\r\nb");
    assert.equal(out.includes("\r"), false);
    assert.equal(out.includes("\n"), false);
  });

  it("caps interpolated value length", () => {
    assert.ok(sanitizeTemplateValue("x".repeat(5000)).length <= 400);
  });

  it("never executes template source from user content", () => {
    const out = renderTemplate("{{evil}}", { evil: "{{constructor}}" });
    assert.equal(out.includes("{{"), false);
    assert.equal(out.includes("}}"), false);
  });

  it("renders a known event type with a bounded subject and body", () => {
    const r = renderNotification("comment.mentioned", {
      actorName: "Ada", excerpt: "hello",
    });
    assert.ok(r.subject.length > 0 && r.subject.length <= 300);
    assert.ok(r.bodyText.length <= 2000);
    assert.match(r.bodyText, /Ada/);
  });

  it("fails safe for an unknown event type", () => {
    const r = renderNotification("nope" as never, {});
    assert.equal(r.subject, "Notification");
    assert.equal(r.bodyText, "");
  });

describe("notification retry policy", () => {
  it("is deterministic for the same seed and attempt", () => {
    const a = backoffDelayMs(DEFAULT_RETRY_POLICY, 3, "seed-1");
    const b = backoffDelayMs(DEFAULT_RETRY_POLICY, 3, "seed-1");
    assert.equal(a, b);
  });

  it("varies the jitter across seeds but stays inside the ratio", () => {
    const base = DEFAULT_RETRY_POLICY.baseDelayMs * 2 ** 2;
    for (const seed of ["a", "b", "c", "d"]) {
      const d = backoffDelayMs(DEFAULT_RETRY_POLICY, 3, seed);
      assert.ok(Math.abs(d - base) <= base * DEFAULT_RETRY_POLICY.jitterRatio + 1);
    }
  });

  it("never returns a negative delay", () => {
    for (let i = 0; i < 50; i++) {
      assert.ok(backoffDelayMs(DEFAULT_RETRY_POLICY, i, `s${i}`) >= 0);
    }
  });

  it("clamps to maxDelayMs", () => {
    const d = backoffDelayMs(DEFAULT_RETRY_POLICY, 50, "seed");
    assert.ok(d <= DEFAULT_RETRY_POLICY.maxDelayMs);
  });

  it("stops retrying at maxAttempts", () => {
    assert.equal(shouldRetry(DEFAULT_RETRY_POLICY, DEFAULT_RETRY_POLICY.maxAttempts), false);
    assert.equal(shouldRetry(DEFAULT_RETRY_POLICY, 1), true);
  });

  it("produces jitter within [-ratio, +ratio]", () => {
    for (let i = 0; i < 20; i++) {
      const j = deterministicJitter(`s${i}`, i, 0.2);
      assert.ok(j >= -0.2 && j <= 0.2);
    }
  });
});

describe("notification provider seam", () => {
  it("classifies retryable vs terminal failures", () => {
    assert.equal(isRetryableFailure("rate_limited"), true);
    assert.equal(isRetryableFailure("timeout"), true);
    assert.equal(isRetryableFailure("retryable_transport"), true);
    assert.equal(isRetryableFailure("authentication_failed"), false);
    assert.equal(isRetryableFailure("invalid_recipient"), false);
    assert.equal(isRetryableFailure("provider_unavailable"), false);
  });

  it("exposes a closed failure taxonomy", () => {
    assert.deepEqual([...NOTIFY_FAILURES].sort(), [
      "authentication_failed", "invalid_recipient", "provider_rejected",
      "provider_unavailable", "rate_limited", "retryable_transport",
      "timeout", "unsupported_channel",
    ]);
  });

  it("fails closed for an unregistered provider", () => {
    clearNotificationProvidersForTests();
    assert.throws(() => providerForChannel("in_app"), (e: unknown) =>
      e instanceof NotifyProviderError && e.failure === "unsupported_channel");
  });

  it("fails closed for a registered-but-unmapped channel default", () => {
    clearNotificationProvidersForTests();
    registerNotificationProvider(new InAppProvider());
    assert.throws(() => providerForChannel("email"), (e: unknown) =>
      e instanceof NotifyProviderError && e.failure === "unsupported_channel");
  });

  it("resolves a provider through the channel default", () => {
    clearNotificationProvidersForTests();
    registerNotificationProvider(new InAppProvider());
    setChannelDefault("in_app", "in_app");
    assert.equal(providerForChannel("in_app").name, "in_app");
    clearNotificationProvidersForTests();
  });

describe("scripted provider", () => {
  it("is idempotent for a replayed idempotency key", async () => {
    const p = new ScriptedProvider("scripted", "in_app");
    const req = {
      deliveryId: "d1", organizationId: "o1", channel: "in_app" as const,
      recipient: { userId: "u1", address: null }, subject: "s", bodyText: "b",
      payload: {}, priority: "normal" as const, idempotencyKey: "k1",
    };
    const a = await p.send(req);
    const b = await p.send(req);
    assert.equal(a.providerMessageId, b.providerMessageId);
    assert.equal(p.acceptedKeys.length, 1);
    assert.equal(p.calls.length, 2);
  });

  it("throws a NotifyProviderError for a scripted failure", async () => {
    const p = new ScriptedProvider("scripted", "in_app")
      .script_outcomes({ kind: "fail", failure: "rate_limited", retryable: true });
    await assert.rejects(
      () => p.send({
        deliveryId: "d1", organizationId: "o1", channel: "in_app" as const,
        recipient: { userId: "u1", address: null }, subject: "s", bodyText: "b",
        payload: {}, priority: "normal" as const, idempotencyKey: "k1",
      }),
      (e: unknown) => e instanceof NotifyProviderError && e.failure === "rate_limited"
    );
  });
});

describe("recipient candidate extraction", () => {
  it("extracts string payload user ids", () => {
    const route = routeFor("task.assigned")!;
    const ids = candidateUserIds(route, { assigneeUserId: "u1" });
    assert.deepEqual(ids, ["u1"]);
  });

  it("extracts string arrays from payload", () => {
    const route = routeFor("comment.mentioned")!;
    const ids = candidateUserIds(route, { mentionedUserIds: ["u1", "u2", "u1"] });
    assert.deepEqual(ids, ["u1", "u2"]);
  });

  it("ignores non-string ids (never coerces numbers/objects)", () => {
    const route = routeFor("comment.mentioned")!;
    const ids = candidateUserIds(route, { mentionedUserIds: [1, {}, "u3"] as unknown[] });
    assert.deepEqual(ids, ["u3"]);
  });

  it("returns no candidates for org_permission routes (SQL-resolved)", () => {
    const route = routeFor("billing.invoice.created")!;
    assert.deepEqual(candidateUserIds(route, { anything: "u1" }), []);
  });
});

});



describe("domain events", () => {
  it("canonicalizes object keys deterministically", () => {
    assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
  });

  it("produces a stable dedupe key for the same logical event", () => {
    const a = dedupeKeyFor({
      eventType: "task.assigned", aggregateType: "engineering_task",
      aggregateId: "t1", payload: { action: "assigned", taskId: "t1" },
    });
    const b = dedupeKeyFor({
      eventType: "task.assigned", aggregateType: "engineering_task",
      aggregateId: "t1", payload: { taskId: "t1", action: "assigned" },
    });
    assert.equal(a, b);
  });

  it("produces a different dedupe key for a different payload", () => {
    const a = dedupeKeyFor({
      eventType: "task.assigned", aggregateType: "engineering_task",
      aggregateId: "t1", payload: { action: "assigned" },
    });
    const b = dedupeKeyFor({
      eventType: "task.assigned", aggregateType: "engineering_task",
      aggregateId: "t1", payload: { action: "reassigned" },
    });
    assert.notEqual(a, b);
  });

  it("requires every declared payload key for every event type", () => {
    for (const t of DOMAIN_EVENT_TYPES) {
      const spec = DOMAIN_EVENT_SPECS[t];
      assert.ok(spec.required.length > 0, `no required keys declared for ${t}`);
      for (const k of spec.required) {
        assert.equal(typeof k, "string");
      }
    }
  });
});

describe("notification channels", () => {
  it("accepts only the canonical channels", () => {
    assert.equal(isNotificationChannel("in_app"), true);
    assert.equal(isNotificationChannel("email"), true);
    assert.equal(isNotificationChannel("sms"), false);
    assert.equal(isNotificationChannel("push"), false);
  });
});

describe("notification role permissions", () => {
  it("lets every role read notifications", () => {
    for (const role of ["owner", "admin", "manager", "developer", "designer", "client", "support", "auditor"]) {
      assert.equal(canRoleInOrg(role, "org-1", "notification.read"), true, role);
    }
  });

  it("restricts notification administration to owner/admin", () => {
    assert.equal(canRoleInOrg("owner", "org-1", "notification.admin"), true);
    assert.equal(canRoleInOrg("admin", "org-1", "notification.admin"), true);
    assert.equal(canRoleInOrg("manager", "org-1", "notification.admin"), false);
    assert.equal(canRoleInOrg("developer", "org-1", "notification.admin"), false);
  });

  it("lets every role manage its own preferences", () => {
    for (const role of ["owner", "admin", "manager", "developer", "designer", "client", "support", "auditor"]) {
      assert.equal(canRoleInOrg(role, "org-1", "notification.preferences.manage"), true, role);
    }
  });

  it("fails closed for an unknown role", () => {
    assert.equal(canRoleInOrg("wizard", "org-1", "notification.read"), false);
  });
});

});

});
