/**
 * Org-scoped notification API surface (Phase 14).
 *
 * Every read is scoped to BOTH the organization AND the calling user's own
 * recipient id — a notification is never readable by another member, and a
 * cross-tenant id never resolves (INV-TEN-*).
 */
import { TenantContext } from "./tenancy.js";
import { NotificationRepository } from "../persistence/notificationRepository.ts";
import { PreferenceRepository } from "../persistence/notificationPreferenceRepository.ts";
import { AuditRepository } from "../persistence/auditRepository.ts";
import { NotificationChannel, isNotificationChannel } from "./notificationChannels.ts";
import { ValidationError } from "./errors.ts";
import { ForbiddenError } from "./authorization.js";

const notifications = new NotificationRepository();
const prefs = new PreferenceRepository();
const audits = new AuditRepository();

export interface NotificationPage {
  rows: Record<string, unknown>[];
  nextCursor: { c: string; id: string } | null;
}

/** List the caller's own notifications, newest first. */
export async function listMyNotifications(
  ctx: TenantContext, userId: string,
  opts: { limit?: number; unreadOnly?: boolean; cursor?: { c: string; id: string } | null } = {}
): Promise<NotificationPage> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const rows = (await notifications.listForRecipient({
    organizationId: ctx.organizationId,
    recipientUserId: userId,
    limit: limit + 1,
    cursor: opts.cursor ?? null,
    unreadOnly: opts.unreadOnly ?? false,
  })) as Record<string, unknown>[];
  const pageRows = rows.slice(0, limit);
  const next = rows.length > limit && pageRows.length
    ? { c: String(pageRows[pageRows.length - 1].created_at), id: String(pageRows[pageRows.length - 1].id) }
    : null;
  return { rows: pageRows, nextCursor: next };
}

/**
 * Mark one notification read. Ownership is enforced by the repository
 * predicate (org + recipient), so a forged id simply does not resolve.
 */
export async function markNotificationRead(
  ctx: TenantContext, userId: string, notificationId: string
): Promise<Record<string, unknown> | null> {
  const row = await notifications.markRead(notificationId, ctx.organizationId, userId);
  if (!row) return null;
  await audits.append(ctx, "notification.read", "notification", notificationId, "success", {});
  return row;
}

/** Mark every unread notification of the caller read. */
export async function markAllNotificationsRead(
  ctx: TenantContext, userId: string
): Promise<number> {
  const n = await notifications.markAllRead(ctx.organizationId, userId);
  await audits.append(ctx, "notification.read_all", "notification", userId, "success", { count: n });
  return n;
}

/** The caller's own effective preferences, keyed by type+channel. */
export async function listMyPreferences(
  ctx: TenantContext, userId: string
): Promise<Record<string, unknown>[]> {
  return prefs.listForUser(ctx.organizationId, userId) as Promise<Record<string, unknown>[]>;
}

/**
 * Upsert one preference for the caller. A user may only manage their OWN
 * preferences — the target user id is always the authenticated subject.
 */
export async function setMyPreference(
  ctx: TenantContext, userId: string,
  notificationType: string, channel: string, enabled: boolean
): Promise<Record<string, unknown>> {
  const type = notificationType.trim();
  if (!type || type.length > 100) throw new ValidationError("invalid notificationType");
  if (!isNotificationChannel(channel)) throw new ValidationError("invalid channel");
  const row = await prefs.upsert({
    organizationId: ctx.organizationId, userId,
    notificationType: type, channel: channel as NotificationChannel, enabled,
  });
  await audits.append(ctx, "notification.preference_updated", "notification_preference",
    String(row.id), "success", { notificationType: type, channel, enabled });
  return row;
}

/**
 * Admin view: preferences of another member. Requires notification.admin at
 * the route layer; this service re-checks the org scope explicitly.
 */
export async function listPreferencesOf(
  ctx: TenantContext, targetUserId: string
): Promise<Record<string, unknown>[]> {
  if (!targetUserId) throw new ValidationError("userId required");
  return prefs.listForUser(ctx.organizationId, targetUserId) as Promise<Record<string, unknown>[]>;
}

/** Guard for admin-scoped notification operations. */
export function requireNotificationAdmin(allowed: boolean): void {
  if (!allowed) throw new ForbiddenError("notification administration not permitted");
}
