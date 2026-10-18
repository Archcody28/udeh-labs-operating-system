/** Provider-neutral AI seam (Phase 10). No vendor SDK may be imported by domain code. */
export interface ProviderToolRequest {
  toolId: string;
  input: Record<string, unknown>;
}
export interface ProviderDraft {
  summary: string;
  steps: Array<{ title: string; toolId?: string; input?: Record<string, unknown> }>;
  toolRequests: ProviderToolRequest[];
  usage?: { inputTokens?: number; outputTokens?: number; durationMs?: number };
}
export interface ProviderContext {
  runId: string;
  organizationId: string;
  projectId: string;
  agentId: string;
  agentVersionId: string;
  model: string;
  systemInstructions: string;
  /** User/project content — labeled untrusted; never authorization. */
  untrustedInput: string;
  allowedTools: string[];
  budget: { maxTokens?: number; timeoutMs: number; maxToolCalls: number };
}
export interface AIProvider {
  readonly name: string;
  generate(ctx: ProviderContext): Promise<ProviderDraft>;
}

/** Controlled unavailable provider: honest error when no provider is configured. */
export class UnavailableProvider implements AIProvider {
  readonly name = "unavailable";
  async generate(_ctx: ProviderContext): Promise<ProviderDraft> {
    const { AiError } = await import("./aiErrors.js");
    throw new AiError("provider_unavailable", "no AI provider is configured for this deployment", {});
  }
}
