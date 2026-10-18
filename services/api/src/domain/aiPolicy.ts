/** Centralized AI policy evaluator (Phase 10): deny-by-default, deterministic, auditable. */
import { AiError } from "./aiErrors.js";

export type ToolRisk = "read" | "write" | "high_risk" | "external_side_effect";

export interface AiPolicyDoc {
  id: string;
  organization_id: string;
  project_id?: string | null;
  agent_id?: string | null;
  allowed_tools: string[];
  denied_tools: string[];
  model?: string | null;
  max_tokens?: number | null;
  timeout_ms?: number | null;
  max_tool_calls?: number | null;
  approval_required: boolean;
  execution_mode?: string | null;
  status: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export interface ToolEvalInput {
  policy: AiPolicyDoc;
  organizationId: string;
  projectId?: string | null;
  toolId: string;
  risk: ToolRisk;
  planApproved: boolean;
  approvalConsumed: boolean;
  toolCallsUsed: number;
}

/**
 * Can this AI principal perform this action against this resource under this
 * policy at this point in time? Deny-by-default at every branch.
 */
export function evaluateToolCall(input: ToolEvalInput): PolicyDecision {
  const { policy, organizationId, projectId, toolId, risk, planApproved, approvalConsumed, toolCallsUsed } = input;
  if (policy.status !== "active") return { allowed: false, reason: "policy not active" };
  if (policy.organization_id !== organizationId) return { allowed: false, reason: "policy org mismatch" };
  if (policy.project_id && projectId && policy.project_id !== projectId) {
    return { allowed: false, reason: "policy project mismatch" };
  }
  if (policy.denied_tools.includes(toolId)) return { allowed: false, reason: "tool denied by policy" };
  if (!policy.allowed_tools.includes(toolId) && !policy.allowed_tools.includes("*")) {
    return { allowed: false, reason: "tool not allowlisted" };
  }
  if (policy.max_tool_calls != null && toolCallsUsed >= policy.max_tool_calls) {
    return { allowed: false, reason: "tool-call budget exhausted" };
  }
  if ((risk === "high_risk" || risk === "external_side_effect") && !planApproved) {
    return { allowed: false, reason: "high-risk tool requires approved plan" };
  }
  if (policy.approval_required && !approvalConsumed) {
    return { allowed: false, reason: "policy requires consumed approval" };
  }
  return { allowed: true, reason: "allowed" };
}

/** Budget guard: token/time/tool-call limits. Exhaustion stops execution. */
export function checkBudget(policy: AiPolicyDoc, usage: { tokens?: number; elapsedMs: number; toolCalls: number })
  : PolicyDecision {
  if (policy.max_tokens != null && (usage.tokens ?? 0) > policy.max_tokens) {
    return { allowed: false, reason: "token budget exceeded" };
  }
  if (policy.timeout_ms != null && usage.elapsedMs > policy.timeout_ms) {
    return { allowed: false, reason: "timeout exceeded" };
  }
  if (policy.max_tool_calls != null && usage.toolCalls > policy.max_tool_calls) {
    return { allowed: false, reason: "tool-call budget exceeded" };
  }
  return { allowed: true, reason: "within budget" };
}

/** Validate provider draft output before it becomes an action. */
export function validateDraftOutput(
  draft: { summary: string; steps: unknown[]; toolRequests: { toolId: string; input: unknown }[] },
  allowedTools: string[],
  maxBytes = 65536,
): void {
  const raw = JSON.stringify(draft);
  if (raw.length > maxBytes) throw new AiError("invalid_model_output", "provider output oversized", {});
  for (const t of draft.toolRequests) {
    if (!t.toolId || typeof t.toolId !== "string") {
      throw new AiError("invalid_model_output", "malformed tool call: missing tool id", {});
    }
    if (!allowedTools.includes(t.toolId)) {
      throw new AiError("tool_denied", `unknown or unauthorized tool: ${t.toolId}`, {});
    }
    if (t.input != null && (typeof t.input !== "object" || Array.isArray(t.input))) {
      throw new AiError("invalid_model_output", "malformed tool call: invalid params", {});
    }
  }
}
