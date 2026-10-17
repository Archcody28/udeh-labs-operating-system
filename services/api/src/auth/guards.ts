/**
 * Centralized request authorization pipeline:
 * HTTP → correlation → authentication → principal → tenant → authorization → handler.
 * Handlers never authenticate ad hoc; public routes are an explicit allowlist.
 */
import { IncomingMessage, ServerResponse } from "node:http";
import { AuthService } from "./authService.js";
import { anonymousPrincipal, AuthPrincipal, isAuthenticated } from "../domain/principal.js";
import { resolveTenantContext } from "../domain/tenant.js";
import { requirePermission, requireAssurance, Permission, UnauthorizedError } from "../domain/authorization.js";
import { TenantContext } from "../domain/tenancy.js";
import { loginLimiter, sensitiveLimiter } from "../domain/rateLimit.js";
import { sendJson } from "../api/http.js";
import { AppError } from "../domain/errors.js";
import type { RateLimiter } from "../domain/rateLimit.js";

export class RateLimitedError extends AppError {
  constructor() {
    super("RATE_LIMITED", "rate limit exceeded", 429, true);
  }
}

export const PUBLIC_PATHS = new Set(["/health", "/ready"]);

const authService = new AuthService();

function bearerOf(req: IncomingMessage): string | null {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) return h.slice(7).trim();
  const cookie = req.headers.cookie ?? "";
  const m = cookie.match(/(?:^|;\s*)udehlabs_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Authenticate: Bearer/cookie → live principal, else anonymous. */
export async function authenticate(req: IncomingMessage, correlationId: string): Promise<AuthPrincipal> {
  const token = bearerOf(req);
  if (!token) return anonymousPrincipal(correlationId);
  try {
    const p = await authService.principalForToken(token, correlationId);
    return p ?? anonymousPrincipal(correlationId);
  } catch {
    return anonymousPrincipal(correlationId);
  }
}

/** Rate-limit gate for security-sensitive endpoints. Throws 429-shaped error. */
export function checkRateLimit(limiter: RateLimiter, key: string): void {
  if (!limiter.attempt(key)) throw new RateLimitedError();
}

/**
 * Guard an org-scoped route: authenticate → resolve tenant (server-side) →
 * enforce permission → optional step-up. Returns { principal, ctx }.
 */
export async function guardOrgRoute(
  req: IncomingMessage,
  correlationId: string,
  requestedOrgId: string,
  permission: Permission,
  stepUpAction?: string
): Promise<{ principal: AuthPrincipal; ctx: TenantContext }> {
  const principal = await authenticate(req, correlationId);
  if (!isAuthenticated(principal)) throw new UnauthorizedError();
  const ctx = resolveTenantContext(principal, requestedOrgId, correlationId);
  requirePermission(principal, requestedOrgId, permission);
  if (stepUpAction) requireAssurance(principal, stepUpAction);
  return { principal, ctx };
}

export function sessionCookie(token: string, secure: boolean): string {
  const parts = [`udehlabs_session=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=86400"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function authHeaders(res: ServerResponse, token: string, secure: boolean): void {
  res.setHeader("Set-Cookie", sessionCookie(token, secure));
}

export function rateLimitKey(req: IncomingMessage, suffix: string, scope?: { principalId?: string; organizationId?: string }): string {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress ?? "unknown";
  // Tenant-scoped key: ip + principal + org + action. No cross-tenant collisions:
  // org B traffic can never consume org A's bucket, and anonymous traffic
  // stays in its own ip-only bucket.
  const p = scope?.principalId ? `p=${scope.principalId}` : "p=anon";
  const o = scope?.organizationId ? `o=${scope.organizationId}` : "o=none";
  return `${ip}|${p}|${o}:${suffix}`;
}

export { authService, loginLimiter, sensitiveLimiter, sendJson };
