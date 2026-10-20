/**
 * Notification templates (Phase 14). No arbitrary template language: templates
 * are fixed server-side strings with `{{key}}` placeholders resolved ONLY
 * against a structured, sanitized context map. User-controlled content is
 * treated as untrusted data, never as template source.
 *
 * Safety properties (INV-NOTIFY-03):
 * - No code execution; no expressions; no includes.
 * - Unknown placeholders render as empty (no context leakage).
 * - Interpolated values are HTML-escaped and length-capped before insertion,
 *   defeating HTML/script injection into any future HTML-capable channel.
 * - URLs are never rendered from user input; only provider-built links.
 */
import { DomainEventType } from "./domainEvents.js";

const MAX_VALUE_LEN = 400;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#47;",
  // Braces are escaped too: an interpolated value must never be able to look
  // like a placeholder, so a value can never re-enter the template grammar.
  "{": "&#123;", "}": "&#125;",
};

export function escapeHtml(v: string): string {
  return v.replace(/[&<>"'/{}]/g, (c) => HTML_ESCAPES[c] ?? c);
}

/** Sanitize a context value: stringify, strip control chars, cap, escape. */
export function sanitizeTemplateValue(v: unknown): string {
  const raw = typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
  // Strip C0/C1 control characters (header/log-injection defense) without
  // embedding literal control chars in source: filter by code point.
  let s = "";
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    s += code <= 0x1f || (code >= 0x7f && code <= 0x9f) ? " " : ch;
  }
  s = s.slice(0, MAX_VALUE_LEN);
  return escapeHtml(s);
}

/** Render `{{key}}` placeholders from a context map. Unknown keys → "". */
export function renderTemplate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_m, key: string) =>
    sanitizeTemplateValue(ctx[key])
  );
}

/** Per-event-type fixed templates. Server-controlled; never client-supplied. */
export const NOTIFICATION_TEMPLATES: Record<DomainEventType, { subject: string; body: string }> = {
  "comment.mentioned": {
    subject: "You were mentioned",
    body: "{{actorName}} mentioned you: {{excerpt}}",
  },
  "task.assigned": {
    subject: "You were assigned a task",
    body: "{{actorName}} assigned you a task ({{action}}).",
  },
  "task.unassigned": {
    subject: "You were unassigned from a task",
    body: "{{actorName}} unassigned you from the task.",
  },
  "billing.invoice.created": {
    subject: "New invoice {{invoiceNumber}}",
    body: "Invoice {{invoiceNumber}} for {{currency}} {{totalMinor}} was created.",
  },
  "billing.payment.failed": {
    subject: "Payment failed",
    body: "A payment failed: {{failureCode}}.",
  },
  "billing.payment.succeeded": {
    subject: "Payment received",
    body: "A payment succeeded.",
  },
  "agent.run.failed": {
    subject: "Agent run failed",
    body: "Agent run {{runId}} failed: {{category}}.",
  },
  "integration.disconnected": {
    subject: "Integration disconnected",
    body: "Integration {{integrationId}} ({{kind}}) was disconnected.",
  },
  "integration.revoked": {
    subject: "Integration revoked",
    body: "Integration {{integrationId}} ({{kind}}) was revoked.",
  },
  "review.decided": {
    subject: "Review {{decision}}",
    body: "A review was decided: {{decision}}.",
  },
  "deployment.triggered": {
    subject: "Deployment triggered",
    body: "Deployment {{deploymentId}} was triggered.",
  },
};

export interface RenderedNotification {
  subject: string; // sanitized, escaped, ≤300 chars (DB CHECK)
  bodyText: string; // sanitized, escaped, ≤2000 chars (DB CHECK)
}

export function renderNotification(
  eventType: DomainEventType,
  ctx: Record<string, unknown>
): RenderedNotification {
  const t = NOTIFICATION_TEMPLATES[eventType];
  if (!t) {
    // Fail safe rather than render unknown content.
    return { subject: "Notification", bodyText: "" };
  }
  return {
    subject: renderTemplate(t.subject, ctx).slice(0, 300) || "Notification",
    bodyText: renderTemplate(t.body, ctx).slice(0, 2000),
  };
}


