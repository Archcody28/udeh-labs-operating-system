/**
 * Canonical domain-event model + transactional outbox publication (Phase 14).
 *
 * Invariant INV-EVT-01: a business mutation and its outbox row commit in the
 * SAME transaction via publishDomainEvent(tx, ...). Events are immutable
 * (DB trigger forbids UPDATE/DELETE). Consumers never mutate history.
 *
 * Deterministic identity: dedupe_key = (type, aggregateId, payload hash).
 * Replaying an identical logical event collapses to the existing row — the
 * caller observes duplicate=true and no second outbox entry appears.
 */
import { createHash, randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { TenantContext } from "./tenancy.js";
import { ValidationError } from "./errors.js";

/** Canonical, explicitly-routed event types that actually exist in the repo. */
export const DOMAIN_EVENT_TYPES = [
  "comment.mentioned",
  "task.assigned",
  "task.unassigned",
  "billing.invoice.created",
  "billing.payment.failed",
  "billing.payment.succeeded",
  "agent.run.failed",
  "integration.disconnected",
  "integration.revoked",
  "review.decided",
  "deployment.triggered",
] as const;
export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

/** Per-type payload contract. Keys are validated on publish; unknown types are rejected. */
export interface DomainEventSpec {
  version: number;
  /** Required, non-empty payload keys. Values must be primitives or string arrays. */
  required: string[];
}

export const DOMAIN_EVENT_SPECS: Record<DomainEventType, DomainEventSpec> = {
  "comment.mentioned": { version: 1, required: ["commentId", "targetType", "targetId", "mentionedUserIds", "excerpt"] },
  "task.assigned": { version: 1, required: ["taskId", "assigneeUserId", "action"] },
  "task.unassigned": { version: 1, required: ["taskId", "assigneeUserId", "action"] },
  "billing.invoice.created": { version: 1, required: ["invoiceId", "invoiceNumber", "totalMinor", "currency"] },
  "billing.payment.failed": { version: 1, required: ["paymentId", "invoiceId", "failureCode"] },
  "billing.payment.succeeded": { version: 1, required: ["paymentId", "invoiceId"] },
  "agent.run.failed": { version: 1, required: ["runId", "category"] },
  "integration.disconnected": { version: 1, required: ["integrationId", "kind"] },
  "integration.revoked": { version: 1, required: ["integrationId", "kind"] },
  "review.decided": { version: 1, required: ["reviewId", "decision"] },
  "deployment.triggered": { version: 1, required: ["deploymentId"] },
};

export interface DomainEventInput {
  organizationId: string;
  workspaceId?: string | null;
  projectId?: string | null;
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  actorUserId?: string | null;
  principalType?: "human" | "agent" | "system";
  payload: Record<string, unknown>;
  correlationId: string;
  causationEventId?: string | null;
}

export interface PublishedDomainEvent {
  eventId: string;
  outboxId: string;
  duplicate: boolean;
}


/** Canonical JSON with sorted keys — stable across processes for hashing. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return "{" + entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalJson(v)).join(",") + "}";
}

/** Deterministic identity for a logical event. */
export function dedupeKeyFor(
  input: Pick<DomainEventInput, "eventType" | "aggregateType" | "aggregateId" | "payload">
): string {
  const h = createHash("sha256")
    .update(canonicalJson([input.eventType, input.aggregateType, input.aggregateId, input.payload]))
    .digest("hex")
    .slice(0, 32);
  return `${input.eventType}:${input.aggregateId}:${h}`;
}

function assertPayloadShape(eventType: DomainEventType, payload: Record<string, unknown>): void {
  const spec = DOMAIN_EVENT_SPECS[eventType];
  if (!spec) throw new ValidationError(`unknown event type: ${eventType}`);
  for (const key of spec.required) {
    const v = payload[key];
    const missing =
      v === undefined || v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);
    if (missing) throw new ValidationError(`event payload missing required key: ${key}`);
  }
  // Every payload value must be a primitive or an array of primitives.
  // This is the schema/version guard: no arbitrary nested blobs.
  for (const [k, v] of Object.entries(payload)) {
    const ok =
      typeof v === "string" || typeof v === "number" || typeof v === "boolean" ||
      (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number"));
    if (!ok) throw new ValidationError(`event payload field ${k} must be a primitive or primitive array`);
  }
}

/**
 * Publish a domain event inside the caller's transaction (INV-EVT-01).
 * Inserts the immutable event row and its outbox row atomically. Replays of
 * the same logical event are collapsed via the dedupe unique index.
 */
export async function publishDomainEvent(
  tx: PoolClient,
  input: DomainEventInput,
  causationEventId?: string
): Promise<PublishedDomainEvent> {
  assertPayloadShape(input.eventType, input.payload);
  const spec = DOMAIN_EVENT_SPECS[input.eventType];
  const dedupeKey = dedupeKeyFor(input);
  const eventId = randomUUID();
  const inserted = await tx.query(
    `INSERT INTO domain_events
       (id, organization_id, workspace_id, project_id, event_type, aggregate_type, aggregate_id,
        actor_user_id, principal_type, event_version, schema_version, payload, correlation_id,
        causation_event_id, dedupe_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (organization_id, dedupe_key) DO NOTHING
     RETURNING id`,
    [
      eventId, input.organizationId, input.workspaceId ?? null, input.projectId ?? null,
      input.eventType, input.aggregateType, input.aggregateId,
      input.actorUserId ?? null, input.principalType ?? "human",
      spec.version, spec.version,
      JSON.stringify(input.payload), input.correlationId,
      causationEventId ?? input.causationEventId ?? null, dedupeKey,
    ]
  );
  if (inserted.rowCount === 0) {
    const existing = await tx.query(
      "SELECT id FROM domain_events WHERE organization_id=$1 AND dedupe_key=$2",
      [input.organizationId, dedupeKey]
    );
    const existingId = existing.rows[0].id as string;
    const outbox = await tx.query(
      `INSERT INTO outbox_events (event_id, organization_id) VALUES ($1,$2)
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [existingId, input.organizationId]
    );
    const outboxId = outbox.rowCount
      ? (outbox.rows[0].id as string)
      : (await tx.query("SELECT id FROM outbox_events WHERE event_id=$1", [existingId])).rows[0].id as string;
    return { eventId: existingId, outboxId, duplicate: true };
  }
  const outbox = await tx.query(
    "INSERT INTO outbox_events (event_id, organization_id) VALUES ($1,$2) RETURNING id",
    [eventId, input.organizationId]
  );
  return { eventId, outboxId: outbox.rows[0].id as string, duplicate: false };
}

/** Build a publish input from an existing TenantContext. */
export function eventInputFrom(
  ctx: TenantContext,
  eventType: DomainEventType,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  opts?: { projectId?: string | null; workspaceId?: string | null }
): DomainEventInput {
  return {
    organizationId: ctx.organizationId,
    workspaceId: opts?.workspaceId ?? ctx.workspaceId ?? null,
    projectId: opts?.projectId ?? ctx.projectId ?? null,
    eventType,
    aggregateType,
    aggregateId,
    actorUserId: ctx.actorId ?? null,
    principalType: ctx.principalType ?? "human",
    payload,
    correlationId: ctx.correlationId,
  };
}

