import { IncomingMessage, ServerResponse } from "node:http";
import { AiRepository } from "../persistence/aiRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { authenticate, guardOrgRoute } from "../auth/guards.js";
import { isAuthenticated } from "../domain/principal.js";
import { UnauthorizedError, ForbiddenError } from "../domain/authorization.js";
import { agentRuntime } from "../domain/aiRuntime.js";
import { coordinationService } from "../domain/aiCoordination.js";

const repos = new AiRepository();
const audits = new AuditRepository();

function orgIdOf(req: IncomingMessage, body?: Record<string, unknown>): string | null {
  const q = req.url ? new URL(req.url, "http://localhost").searchParams.get("organizationId") : null;
  if (q) return q;
  return body?.organizationId ? String(body.organizationId) : null;
}

function actorOf(g: { principal: { subjectId: string } }): string {
  return g.principal.subjectId;
}

export async function handleAiRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  // --- Agents ---
  if (method === "POST" && url.pathname === "/api/v1/agents") {
    const body = await readJsonBody(req);
    const orgId = orgIdOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.create");
    if (!body.name) throw new ValidationError("name required");
    const agent = await agentRuntime.createAgent(g.ctx, body.projectId ? String(body.projectId) : null,
      String(body.name), String(body.description ?? ""), actorOf(g), actorOf(g));
    return sendJson(res, 201, { data: { agent }, correlationId: cid }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/agents") {
    const orgId = orgIdOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.read");
    const agents = await repos.listAgents(g.ctx);
    return sendJson(res, 200, { ...page(agents, null, 100), correlationId: cid }, cid), true;
  }
  const mAgent = url.pathname.match(/^\/api\/v1\/agents\/([^\/]+)(\/versions|\/provision|\/policies)?$/);
  if (mAgent) {
    const [, agentId, suffix] = mAgent;
    if (method === "POST" && suffix === "/versions") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.create");
      if (!body.model || !body.systemInstructions) throw new ValidationError("model and systemInstructions required");
      const version = await agentRuntime.createVersion(g.ctx, agentId, {
        model: String(body.model), systemInstructions: String(body.systemInstructions),
        toolPolicy: body.toolPolicy, budgetPolicy: body.budgetPolicy,
        outputConstraints: body.outputConstraints, runtimeConfig: body.runtimeConfig
      }, actorOf(g));
      return sendJson(res, 201, { data: { version }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/provision") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.update");
      if (!body.version) throw new ValidationError("version required");
      const out = await agentRuntime.provision(g.ctx, agentId, Number(body.version), actorOf(g));
      return sendJson(res, 200, { data: { agent: out }, correlationId: cid }, cid), true;
    }
    if (method === "GET" && suffix === "/policies") {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.policy.read");
      const policy = await repos.activePolicyFor(g.ctx, agentId);
      return sendJson(res, 200, { data: { policy }, correlationId: cid }, cid), true;
    }
    if (method === "PATCH" && suffix === "/policies") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.policy.update");
      const policy = await agentRuntime.createPolicy(g.ctx, agentId,
        body.projectId ? String(body.projectId) : null, {
          allowedTools: Array.isArray(body.allowedTools) ? body.allowedTools : [],
          deniedTools: Array.isArray(body.deniedTools) ? body.deniedTools : [],
          model: body.model === null || body.model === undefined ? undefined : String(body.model),
          maxTokens: typeof body.maxTokens === "number" ? body.maxTokens : undefined,
          timeoutMs: typeof body.timeoutMs === "number" ? body.timeoutMs : 120000,
          maxToolCalls: typeof body.maxToolCalls === "number" ? body.maxToolCalls : 25,
          approvalRequired: body.approvalRequired !== false,
          executionMode: typeof body.executionMode === "string" ? body.executionMode : "supervised"
        }, actorOf(g));
      return sendJson(res, 200, { data: { policy }, correlationId: cid }, cid), true;
    }
  }
  // --- Agent runs ---
  if (method === "POST" && url.pathname === "/api/v1/agent-runs") {
    const body = await readJsonBody(req);
    const orgId = orgIdOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.run");
    if (!body.projectId || !body.agentId || !body.key) throw new ValidationError("projectId, agentId and key required");
    const run = await agentRuntime.startRun(g.ctx, String(body.projectId), String(body.agentId),
      String(body.key), String(body.untrustedInput ?? ""), actorOf(g),
      body.sessionId ? String(body.sessionId) : undefined);
    return sendJson(res, 201, { data: { run }, correlationId: cid }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/agent-runs") {
    const orgId = orgIdOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.read");
    const runs = await repos.listRuns(g.ctx);
    return sendJson(res, 200, { ...page(runs, null, 100), correlationId: cid }, cid), true;
  }
  const mRun = url.pathname.match(/^\/api\/v1\/agent-runs\/([^\/]+)(\/cancel|\/plans|\/results|\/execute)?$/);
  if (mRun) {
    const [, runId, suffix] = mRun;
    if (method === "GET" && !suffix) {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.read");
      const run = await repos.findRun(g.ctx, runId);
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
    if (method === "PATCH" && !suffix) {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.cancel");
      if (body.status !== "halted") throw new ValidationError("only halt supported");
      const run = await repos.findRun(g.ctx, runId);
      const out = await agentRuntime.cancelRun(g.ctx, runId, run.version, actorOf(g));
      return sendJson(res, 200, { data: { run: out }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/plans") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      if (!Array.isArray(body.steps) || body.steps.length === 0) throw new ValidationError("steps required");
      const plan = await agentRuntime.proposePlan(g.ctx, runId, body.steps, actorOf(g));
      return sendJson(res, 201, { data: { plan }, correlationId: cid }, cid), true;
    }
    if (method === "GET" && suffix === "/plans") {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.plan.read");
      const plans = await repos.listPlans(g.ctx, runId);
      return sendJson(res, 200, { ...page(plans, null, 100), correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/execute") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      const run = await agentRuntime.executeRun(g.ctx, runId, actorOf(g));
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
    if (method === "GET" && suffix === "/results") {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.result.read");
      const results = await repos.listResults(g.ctx, runId);
      return sendJson(res, 200, { ...page(results, null, 100), correlationId: cid }, cid), true;
    }
    const mApprove = url.pathname.match(/^\/api\/v1\/agent-runs\/([^\/]+)\/plans\/([^\/]+)\/approve$/);
    if (mApprove && method === "POST") {
      const [, runId2, planId] = mApprove;
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.plan.approve");
      const run = await repos.findRun(g.ctx, runId2);
      const out = await agentRuntime.approvePlan(g.ctx, runId2, planId, run.version, "human", actorOf(g));
      return sendJson(res, 200, { data: { plan: out }, correlationId: cid }, cid), true;
    }
  }
  // --- Orchestration sessions (A.9 coordination) ---
  if (method === "POST" && url.pathname === "/api/v1/orchestration-sessions") {
    const body = await readJsonBody(req);
    const orgId = orgIdOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "orchestration.session.create");
    if (!body.projectId) throw new ValidationError("projectId required");
    const session = await coordinationService.createSession(g.ctx, String(body.projectId), actorOf(g));
    return sendJson(res, 201, { data: { session }, correlationId: cid }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/orchestration-sessions") {
    const orgId = orgIdOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "orchestration.session.manage");
    const sessions = await repos.listSessions(g.ctx);
    return sendJson(res, 200, { ...page(sessions, null, 100), correlationId: cid }, cid), true;
  }
  const mSess = url.pathname.match(/^\/api\/v1\/orchestration-sessions\/([^\/]+)(\/assignments|\/locks|\/escalations)?$/);
  if (mSess) {
    const [, sessionId, suffix] = mSess;
    if (method === "POST" && suffix === "/assignments") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "orchestration.session.manage");
      if (!body.agentId || !body.task) throw new ValidationError("agentId and task required");
      const assignment = await coordinationService.createAssignment(g.ctx, sessionId,
        String(body.projectId), String(body.agentId), String(body.task), Number(body.priority ?? 0), actorOf(g));
      return sendJson(res, 201, { data: { assignment }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/locks") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "orchestration.session.manage");
      if (!body.resource || !body.holder) throw new ValidationError("resource and holder required");
      const lock = await coordinationService.acquireLock(g.ctx, sessionId, String(body.resource),
        String(body.holder), Number(body.leaseMs ?? 300000), actorOf(g));
      return sendJson(res, 201, { data: { lock }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/escalations") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "orchestration.session.manage");
      if (!body.reason) throw new ValidationError("reason required");
      const esc = await coordinationService.escalate(g.ctx, sessionId,
        String(body.projectId ?? ""), String(body.reason), actorOf(g));
      return sendJson(res, 201, { data: { escalation: esc }, correlationId: cid }, cid), true;
    }
  }
  void audits; void isAuthenticated; void UnauthorizedError;
  return false;
}
