import { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { getPool } from "../persistence/db.js";
import { OrganizationRepository, WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { MembershipRepository } from "../persistence/membershipRepository.js";
import { InvitationRepository } from "../persistence/invitationRepository.js";
import { SessionRepository } from "../persistence/sessionRepository.js";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { authService, authenticate, guardOrgRoute } from "../auth/guards.js";
import { authHeaders, checkRateLimit, loginLimiter, rateLimitKey, sensitiveLimiter } from "../auth/guards.js";
import { ipLoginLimiter } from "../domain/rateLimit.js";
import { toPublicPrincipal, isAuthenticated } from "../domain/principal.js";
import { UnauthorizedError } from "../domain/authorization.js";

const orgs = new OrganizationRepository();
const workspaces = new WorkspaceRepository();
const projects = new ProjectRepository();
const audits = new AuditRepository();
const memberships = new MembershipRepository();
const invitations = new InvitationRepository();
const sessions = new SessionRepository();

function slugify(v: unknown): string {
  return String(v ?? "").trim().toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function bearerOf(req: IncomingMessage): string | null {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) return h.slice(7).trim();
  const cookie = req.headers.cookie ?? "";
  const m = cookie.match(/(?:^|;\s*)udehlabs_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function secureCookies(): boolean {
  return (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true";
}

export async function handleRoute(req: IncomingMessage, res: ServerResponse, cid: string): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";
  const secure = secureCookies();

  if (method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, { status: "ok", correlationId: cid }, cid);
  }
  if (method === "GET" && url.pathname === "/ready") {
    await getPool().query("SELECT 1");
    return sendJson(res, 200, { status: "ready", correlationId: cid }, cid);
  }
  if (method === "POST" && url.pathname === "/api/v1/auth/register") {
    checkRateLimit(sensitiveLimiter, rateLimitKey(req, "register"));
    const body = await readJsonBody(req);
    if (!body.email || !body.password) throw new ValidationError("email and password required");
    const out = await authService.register(String(body.email), String(body.password),
      String(body.displayName ?? body.email), cid);
    return sendJson(res, 201, { data: out, correlationId: cid }, cid);
  }
  if (method === "POST" && url.pathname === "/api/v1/auth/login") {
    // Coarse per-IP spray defense first (cheap shed), then a strict
    // per-(ip, account) bucket after the body identifies the account.
    // Account identifier is hashed — never stored or logged in the clear.
    checkRateLimit(ipLoginLimiter, rateLimitKey(req, "login-ip"));
    const body = await readJsonBody(req);
    if (!body.email || !body.password) throw new UnauthorizedError("invalid email or password");
    const account = createHash("sha256").update(String(body.email).trim().toLowerCase()).digest("hex").slice(0, 16);
    checkRateLimit(loginLimiter, rateLimitKey(req, `login:${account}`));
    const out = await authService.login(String(body.email), String(body.password), cid, {
      userAgent: req.headers["user-agent"] as string | undefined,
      ip: req.socket.remoteAddress ?? undefined
    });
    authHeaders(res, out.token, secure);
    return sendJson(res, 200, {
      data: { sessionId: out.sessionId, principal: toPublicPrincipal(out.principal), token: out.token },
      correlationId: cid
    }, cid);
  }
  if (method === "POST" && url.pathname === "/api/v1/auth/logout") {
    const token = bearerOf(req);
    if (token) await authService.logout(token, cid);
    res.setHeader("Set-Cookie", "udehlabs_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return sendJson(res, 200, { data: { loggedOut: true }, correlationId: cid }, cid);
  }
  if (method === "POST" && url.pathname === "/api/v1/auth/rotate") {
    const token = bearerOf(req);
    if (!token) throw new UnauthorizedError();
    const next = await authService.rotate(token);
    authHeaders(res, next, secure);
    return sendJson(res, 200, { data: { token: next }, correlationId: cid }, cid);
  }
  if (method === "GET" && url.pathname === "/api/v1/auth/me") {
    const principal = await authenticate(req, cid);
    if (!isAuthenticated(principal)) throw new UnauthorizedError();
    return sendJson(res, 200, { data: toPublicPrincipal(principal), correlationId: cid }, cid);
  }
  if (method === "POST" && url.pathname === "/api/v1/invitations/accept") {
    checkRateLimit(sensitiveLimiter, rateLimitKey(req, "invite-accept"));
    const body = await readJsonBody(req);
    if (!body.token || !body.password) throw new ValidationError("token and password required");
    const out = await authService.acceptInvitation(String(body.token), String(body.password),
      String(body.displayName ?? ""), cid);
    authHeaders(res, out.token, secure);
    return sendJson(res, 200, {
      data: { sessionId: out.sessionId, principal: toPublicPrincipal(out.principal), token: out.token },
      correlationId: cid
    }, cid);
  }
  const { handleOrgRoutes } = await import("./tenancyRoutes.js");
  if (await handleOrgRoutes(req, res, cid, url, method)) return;
  const { handleRequestRoutes } = await import("./requestRoutes.js");
  if (await handleRequestRoutes(req, res, cid, url, method)) return;
  const { handleProposalRoutes } = await import("./proposalRoutes.js");
  if (await handleProposalRoutes(req, res, cid, url, method)) return;
  const { handleCommercialTxRoutes } = await import("./commercialTxRoutes.js");
  if (await handleCommercialTxRoutes(req, res, cid, url, method)) return;
  const { handleContractRoutes } = await import("./contractRoutes.js");
  if (await handleContractRoutes(req, res, cid, url, method)) return;
  const { handleEngineeringRoutes } = await import("./engineeringRoutes.js");
  if (await handleEngineeringRoutes(req, res, cid, url, method)) return;
  const { handleEngineeringTxRoutes } = await import("./engineeringTxRoutes.js");
  if (await handleEngineeringTxRoutes(req, res, cid, url, method)) return;
  const { handleGuardedRoutes } = await import("./guardedRoutes.js");
  if (await handleGuardedRoutes(req, res, cid, url, method)) return;
  return sendJson(res, 404, { code: "NOT_FOUND", message: "not found", correlationId: cid, retryable: false }, cid);
}
