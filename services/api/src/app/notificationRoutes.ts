/**
 * Notification + preference routes (Phase 14).
 *
 * Every route is org-scoped (the organization id in the path must match the
 * caller's membership — enforced by guardOrgRoute) and recipient-scoped
 * (a member only ever sees their OWN notifications).
 */
import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { ForbiddenError } from "../domain/authorization.js";
import { guardOrgRoute } from "../auth/guards.js";
import { canInOrg } from "../domain/authorization.js";
import { isNotificationChannel } from "../domain/notificationChannels.js";
import {
  listMyNotifications, markNotificationRead, markAllNotificationsRead,
  listMyPreferences, setMyPreference, listPreferencesOf,
} from "../domain/notificationApi.js";

/** Decode the opaque cursor the API hands out. */
function decodeCursor(c: string | null): { c: string; id: string } | null {
  if (!c) return null;
  try {
    const raw = Buffer.from(c, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { c: string; id: string };
    if (!parsed.c || !parsed.id) return null;
    return { c: parsed.c, id: parsed.id };
  } catch {
    return null;
  }
}

function encodeCursor(c: string, id: string): string {
  return Buffer.from(JSON.stringify({ c, id }), "utf8").toString("base64url");
}

export async function handleNotificationRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  // /api/v1/organizations/:orgId/notifications  (list / mark-all-read)
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/notifications$/);
  if (m) {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "notification.read");
    const me = g.principal.subjectId;
    if (method === "GET") {
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
      const unreadOnly = url.searchParams.get("unread") === "true";
      const cursor = decodeCursor(url.searchParams.get("cursor"));
      const out = await listMyNotifications(g.ctx, me, { limit, unreadOnly, cursor });
      const next = out.nextCursor
        ? encodeCursor(out.nextCursor.c, out.nextCursor.id)
        : null;
      return sendJson(res, 200, {
        ...page(out.rows, next, limit), correlationId: cid
      }, cid), true;
    }
    if (method === "POST" && url.searchParams.get("action") === "read-all") {
      const n = await markAllNotificationsRead(g.ctx, me);
      return sendJson(res, 200, { data: { updated: n }, correlationId: cid }, cid), true;
    }
    return false;
  }

  // /api/v1/organizations/:orgId/notifications/:id/read
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/notifications\/([^/]+)\/read$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "notification.read");
    const row = await markNotificationRead(g.ctx, g.principal.subjectId, id);
    if (!row) throw new ForbiddenError("notification not found");
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }

  // /api/v1/organizations/:orgId/notification-preferences
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/notification-preferences$/);
  if (m) {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "notification.preferences.manage");
    const me = g.principal.subjectId;
    if (method === "GET") {
      // A caller may always read their OWN preferences. Reading another
      // member's preferences is administrative and requires notification.admin
      // (owner/admin only) — without this check any member could enumerate
      // another member's notification settings via ?userId=.
      const target = url.searchParams.get("userId");
      if (target && target !== me) {
        if (!canInOrg(g.principal, orgId, "notification.admin")) {
          throw new ForbiddenError("notification administration not permitted");
        }
        const rows = await listPreferencesOf(g.ctx, target);
        return sendJson(res, 200, { ...page(rows, null, 100), correlationId: cid }, cid), true;
      }
      const rows = await listMyPreferences(g.ctx, me);
      return sendJson(res, 200, { ...page(rows, null, 100), correlationId: cid }, cid), true;
    }
    if (method === "PUT") {
      const body = await readJsonBody(req);
      const notificationType = String(body.notificationType ?? "");
      const channel = String(body.channel ?? "");
      if (!notificationType) throw new ValidationError("notificationType required");
      if (!isNotificationChannel(channel)) throw new ValidationError("invalid channel");
      if (typeof body.enabled !== "boolean") throw new ValidationError("enabled must be a boolean");
      const row = await setMyPreference(g.ctx, me, notificationType, channel, body.enabled);
      return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
    }
    return false;
  }

  // /api/v1/organizations/:orgId/members/:userId/notification-preferences (admin)
  m = url.pathname.match(
    /^\/api\/v1\/organizations\/([^/]+)\/members\/([^/]+)\/notification-preferences$/);
  if (m && method === "GET") {
    const [, orgId, targetUserId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "notification.admin");
    if (!canInOrg(g.principal, orgId, "notification.admin")) {
      throw new ForbiddenError("notification administration not permitted");
    }
    const rows = await listPreferencesOf(g.ctx, targetUserId);
    return sendJson(res, 200, { ...page(rows, null, 100), correlationId: cid }, cid), true;
  }

  return false;
}

