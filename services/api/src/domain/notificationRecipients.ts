/**
 * Recipient resolution (Phase 14). Authorization-aware: a recipient id from a
 * payload is only a HINT. Before a notification row is created the resolver
 * verifies, server-side, that the user:
 *   1. holds an ACTIVE membership in the event's organization, and
 *   2. the user account itself is active (suspended users receive nothing).
 * Cross-tenant ids, forged ids, and removed members silently resolve to no
 * recipient — never a cross-tenant delivery, never an existence oracle.
 */
import { PoolClient } from "pg";
import { RouteSpec } from "./notificationRouting.js";
import { canRoleInOrg } from "./authorization.js";

export interface ResolvedRecipient {
  userId: string;
  /** In-app has no address; email channel resolves users.email later. */
  address: string | null;
}

interface MemberRow {
  user_id: string;
  email: string | null;
  role: string;
  membership_status: string;
  user_status: string;
}

/**
 * A principal reference is only a user id when it is a UUID. Actors may also be
 * agents, systems, or webhooks ("system", an agent run id, ...). Such a value
 * can never match a `users.id`, so it is treated as "no user actor" instead of
 * being passed to a uuid-typed column (which would raise 22P02).
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUserId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Extract candidate user ids from the payload per the route strategy. */
export function candidateUserIds(route: RouteSpec, payload: Record<string, unknown>): string[] {
  if (route.recipients.kind === "payload_users") {
    const ids: string[] = [];
    for (const key of route.recipients.payloadKeys) {
      const v = payload[key];
      if (typeof v === "string" && v) ids.push(v);
      else if (Array.isArray(v)) for (const x of v) if (typeof x === "string" && x) ids.push(x);
    }
    return [...new Set(ids)];
  }
  return []; // org_permission / actor strategies resolve via SQL below
}

/**
 * Resolve + authorize recipients for an event. Single batched query (no N+1).
 * Actor is never notified of their own action (no self-mention spam).
 */
export async function resolveRecipients(
  tx: PoolClient,
  route: RouteSpec,
  args: { organizationId: string; payload: Record<string, unknown>; actorUserId?: string | null }
): Promise<ResolvedRecipient[]> {
  const { organizationId, payload, actorUserId } = args;

  if (route.recipients.kind === "actor") {
    // A non-user principal (agent/system) has no user recipients.
    if (!isUserId(actorUserId)) return [];
    const r = await activeMember(tx, organizationId, actorUserId);
    return r ? [{ userId: r.user_id, address: r.email }] : [];
  }

  if (route.recipients.kind === "payload_users") {
    // Payload ids are HINTS only: they must be well-formed user ids before
    // they can even be compared against the membership table. A malformed id
    // resolves to nobody (never an error, never an existence oracle).
    const ids = candidateUserIds(route, payload).filter(isUserId);
    const actor = isUserId(actorUserId) ? actorUserId : null;
    const excluded = ids.filter((id) => id !== actor);
    if (excluded.length === 0) return [];
    const res = await tx.query(
      `SELECT m.user_id, u.email, m.role, m.status AS membership_status, u.status AS user_status
       FROM memberships m JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND m.user_id = ANY($2::uuid[])`,
      [organizationId, excluded]
    );
    // Authorization gate: active membership AND active user.
    return (res.rows as MemberRow[])
      .filter((r) => r.membership_status === "active" && r.user_status === "active")
      .map((r) => ({ userId: r.user_id, address: r.email }));
  }

  // org_permission: batch all active members, filter by role permission in code
  // (single query, bounded by org size — no per-user queries).
  const res = await tx.query(
    `SELECT m.user_id, u.email, m.role, m.status AS membership_status, u.status AS user_status
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = $1 AND m.status = 'active' AND u.status = 'active'`,
    [organizationId]
  );
  const permission = route.recipients.permission;
  const actor = isUserId(actorUserId) ? actorUserId : null;
  return (res.rows as MemberRow[])
    .filter((r) => canRoleInOrg(r.role, organizationId, permission))
    .filter((r) => r.user_id !== actor)
    .map((r) => ({ userId: r.user_id, address: r.email }));
}

async function activeMember(
  tx: PoolClient, organizationId: string, userId: string
): Promise<MemberRow | null> {
  const res = await tx.query(
    `SELECT m.user_id, u.email, m.role, m.status AS membership_status, u.status AS user_status
     FROM memberships m JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = $1 AND m.user_id = $2`,
    [organizationId, userId]
  );
  const row = res.rows[0] as MemberRow | undefined;
  if (!row) return null;
  return row.membership_status === "active" && row.user_status === "active" ? row : null;
}
