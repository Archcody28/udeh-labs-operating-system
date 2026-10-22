/**
 * Deterministic event routing (Phase 14). Every routable event type maps to
 * an explicit RouteSpec: which channels, which recipient strategy, priority,
 * and whether the notification is policy-mandatory (cannot be disabled).
 *
 * Routing is data, not scattered strings inside handlers. An event type with
 * no route is simply not delivered (outbox consumers other than notifications
 * may still read it).
 */
import { DomainEventType } from "./domainEvents.ts";
import { NotificationChannel } from "./notificationChannels.ts";
import { Permission } from "./authorization.ts";

/** How recipients are derived. All strategies are authorization-aware and
 * server-resolved; the payload never supplies tenant-authorized recipients. */
export type RecipientStrategy =
  /** Recipients named explicitly in the payload (e.g., mentionedUserIds,
   * assigneeUserId). Each id is re-verified as an active member of the
   * event's organization before delivery. */
  | { kind: "payload_users"; payloadKeys: string[] }
  /** All active org members holding a given permission (e.g., billing admins). */
  | { kind: "org_permission"; permission: Permission }
  /** The actor who caused the event (rare; used for confirmations). */
  | { kind: "actor" };

export interface RouteSpec {
  eventType: DomainEventType;
  channels: NotificationChannel[];
  recipients: RecipientStrategy;
  priority: "low" | "normal" | "high" | "critical";
  /** Mandatory routes (security/policy) bypass user preferences. */
  mandatory: boolean;
}

/** Canonical routing table. Explicit; no defaults, no wildcards. */
export const EVENT_ROUTES: Record<DomainEventType, RouteSpec | null> = {
  "comment.mentioned": {
    eventType: "comment.mentioned",
    channels: ["in_app"],
    recipients: { kind: "payload_users", payloadKeys: ["mentionedUserIds"] },
    priority: "normal",
    mandatory: false,
  },
  "task.assigned": {
    eventType: "task.assigned",
    channels: ["in_app"],
    recipients: { kind: "payload_users", payloadKeys: ["assigneeUserId"] },
    priority: "normal",
    mandatory: false,
  },
  "task.unassigned": {
    eventType: "task.unassigned",
    channels: ["in_app"],
    recipients: { kind: "payload_users", payloadKeys: ["assigneeUserId"] },
    priority: "low",
    mandatory: false,
  },
  "billing.invoice.created": {
    eventType: "billing.invoice.created",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "billing.invoice.read" },
    priority: "normal",
    mandatory: false,
  },
  "billing.payment.failed": {
    eventType: "billing.payment.failed",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "billing.payment.manage" },
    priority: "high",
    mandatory: true, // financial failure must not be silently disabled
  },
  "billing.payment.succeeded": {
    eventType: "billing.payment.succeeded",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "billing.invoice.read" },
    priority: "normal",
    mandatory: false,
  },
  "agent.run.failed": {
    eventType: "agent.run.failed",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "agent.read" },
    priority: "high",
    mandatory: false,
  },
  "integration.disconnected": {
    eventType: "integration.disconnected",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "integration.read" },
    priority: "normal",
    mandatory: false,
  },
  "integration.revoked": {
    eventType: "integration.revoked",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "integration.read" },
    priority: "high",
    mandatory: false,
  },
  "review.decided": {
    eventType: "review.decided",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "engineering.review.read" },
    priority: "normal",
    mandatory: false,
  },
  "deployment.triggered": {
    eventType: "deployment.triggered",
    channels: ["in_app"],
    recipients: { kind: "org_permission", permission: "deployment.read" },
    priority: "normal",
    mandatory: false,
  },
};

/** Routing is explicit: an unroutable event type returns null (never a guess). */
export function routeFor(eventType: string): RouteSpec | null {
  const r = (EVENT_ROUTES as Record<string, RouteSpec | null>)[eventType];
  return r ?? null;
}
