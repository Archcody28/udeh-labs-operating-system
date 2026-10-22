import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.ts";
import { ValidationError } from "../domain/errors.ts";
import { guardOrgRoute } from "../auth/guards.ts";
import { ForbiddenError } from "../domain/authorization.ts";
import { engineeringExecutionService } from "../domain/engineeringExecution.ts";
import { engineeringExecutionRepository } from "../persistence/engineeringExecutionRepository.ts";

const execRepo = engineeringExecutionRepository;

function orgIdOf(req: IncomingMessage, body?: Record<string, unknown>): string | null {
  const q = req.url ? new URL(req.url, "http://localhost").searchParams.get("organizationId") : null;
  if (q) return q;
  return body?.organizationId ? String(body.organizationId) : null;
}

function actorOf(g: { principal: { subjectId: string } }): string {
  return g.principal.subjectId;
}

/** Phase 11: autonomous engineering execution routes. Tenant-scoped, permission-gated,
 *  AI may plan/implement/validate/request-review/revise; humans approve plans and reviews. */
export async function handleEngineeringExecutionRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  if (method === "POST" && url.pathname === "/api/v1/engineering-runs") {
    const body = await readJsonBody(req);
    const orgId = orgIdOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.run");
    if (!body.projectId || !body.taskId || !body.agentId || !body.agentVersionId || !body.policyId) {
      throw new ValidationError("projectId, taskId, agentId, agentVersionId, policyId required");
    }
    const run = await engineeringExecutionService.createRun(g.ctx, {
      projectId: String(body.projectId),
      taskId: String(body.taskId),
      agentId: String(body.agentId),
      agentVersionId: String(body.agentVersionId),
      policyId: String(body.policyId),
      maxIterations: typeof body.maxIterations === "number" ? body.maxIterations : undefined,
      budget: body.budget && typeof body.budget === "object" ? {
        maxTokens: typeof (body.budget as Record<string, unknown>).maxTokens === "number"
          ? Number((body.budget as Record<string, unknown>).maxTokens) : undefined,
        timeoutMs: typeof (body.budget as Record<string, unknown>).timeoutMs === "number"
          ? Number((body.budget as Record<string, unknown>).timeoutMs) : 120000,
        maxToolCalls: typeof (body.budget as Record<string, unknown>).maxToolCalls === "number"
          ? Number((body.budget as Record<string, unknown>).maxToolCalls) : 25
      } : undefined,
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : undefined
    }, actorOf(g));
    return sendJson(res, 201, { data: { run }, correlationId: cid }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/engineering-runs") {
    const orgId = orgIdOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.read");
    const projectId = url.searchParams.get("projectId");
    const limit = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor");
    const out = await execRepo.listRuns(g.ctx, projectId, limit ? Number(limit) : 20, cursor);
    return sendJson(res, 200, { ...page(out.rows, out.nextCursor, limit ? Number(limit) : 20), correlationId: cid }, cid), true;
  }

  const mRun = url.pathname.match(/^\/api\/v1\/engineering-runs\/([^/]+)(\/plan|\/execute|\/implement|\/validate|\/review|\/revise|\/escalate|\/cancel|\/iterations)?$/);
  if (mRun) {
    const [, runId, suffix] = mRun;
    if (method === "GET" && !suffix) {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.read");
      const run = await execRepo.findRun(g.ctx, runId);
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
    if (method === "GET" && suffix === "/iterations") {
      const orgId = orgIdOf(req);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.read");
      const iterations = await execRepo.listIterations(g.ctx, runId);
      return sendJson(res, 200, { data: iterations, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/plan") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      const out = await engineeringExecutionService.generatePlan(g.ctx, runId, actorOf(g),
        String(body.untrustedInput ?? ""));
      return sendJson(res, 201, { data: out, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/execute") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      const run = await engineeringExecutionService.startExecution(g.ctx, runId, actorOf(g));
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/implement") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      const out = await engineeringExecutionService.implementPatch(g.ctx, runId, actorOf(g),
        String(body.untrustedInput ?? ""));
      return sendJson(res, 201, { data: out, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/validate") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      if (!body.iterationId) throw new ValidationError("iterationId required");
      const report = body.report && typeof body.report === "object" && !Array.isArray(body.report)
        ? body.report as import("../domain/engineeringExecution.js").ValidationReport : undefined;
      const out = await engineeringExecutionService.validatePatch(g.ctx, runId,
        String(body.iterationId), actorOf(g), report);
      return sendJson(res, out.validationStatus === "validation_passed" ? 200 : 422,
        { data: out, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/review") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      if (!body.iterationId) throw new ValidationError("iterationId required");
      const out = await engineeringExecutionService.requestReview(g.ctx, runId,
        String(body.iterationId), actorOf(g));
      return sendJson(res, 201, { data: out, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/revise") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      if (!body.previousIterationId) throw new ValidationError("previousIterationId required");
      const out = await engineeringExecutionService.revise(g.ctx, runId,
        String(body.previousIterationId), actorOf(g), String(body.untrustedInput ?? ""));
      return sendJson(res, 201, { data: out, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/escalate") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.run");
      if (!body.reason) throw new ValidationError("reason required");
      const run = await engineeringExecutionService.escalate(g.ctx, runId, actorOf(g),
        String(body.reason));
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
    if (method === "POST" && suffix === "/cancel") {
      const body = await readJsonBody(req);
      const orgId = orgIdOf(req, body);
      if (!orgId) throw new ForbiddenError("organization context required");
      const g = await guardOrgRoute(req, cid, orgId, "agent.cancel");
      const run = await engineeringExecutionService.cancel(g.ctx, runId, actorOf(g));
      return sendJson(res, 200, { data: { run }, correlationId: cid }, cid), true;
    }
  }

  // Human plan approval: separate route, human-gated permission.
  const mPlan = url.pathname.match(/^\/api\/v1\/engineering-runs\/([^/]+)\/plans\/([^/]+)\/approve$/);
  if (mPlan && method === "POST") {
    const [, runId, planId] = mPlan;
    const body = await readJsonBody(req);
    const orgId = orgIdOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "agent.plan.approve");
    if (!body.decision || body.runVersion === undefined || body.planVersion === undefined) {
      throw new ValidationError("decision, runVersion, planVersion required");
    }
    const out = await engineeringExecutionService.approvePlan(g.ctx, runId, planId,
      Number(body.runVersion), Number(body.planVersion),
      body.decision === "denied" ? "denied" : "approved", String(body.note ?? ""), actorOf(g));
    return sendJson(res, 200, { data: out, correlationId: cid }, cid), true;
  }
  return false;
}

