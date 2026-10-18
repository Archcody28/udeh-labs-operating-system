/** Deterministic AI provider test double (Phase 10).
 *  Records every context it is invoked with and returns a configured draft.
 *  Never produces fabricated output; tests assert on the recorded contexts.
 */
import { AIProvider, ProviderContext, ProviderDraft } from "../domain/aiProvider.js";

export class TestProvider implements AIProvider {
  readonly name = "test";
  readonly calls: ProviderContext[] = [];
  draft: ProviderDraft = {
    summary: "ok",
    steps: [{ title: "inspect", toolId: "task.read", input: { id: "t-1" } }],
    toolRequests: [{ toolId: "task.read", input: { id: "t-1" } }],
    usage: { inputTokens: 10, outputTokens: 5, durationMs: 100 }
  };
  fail: Error | null = null;

  async generate(ctx: ProviderContext): Promise<ProviderDraft> {
    this.calls.push(ctx);
    if (this.fail) throw this.fail;
    return JSON.parse(JSON.stringify(this.draft));
  }
}

export const testProvider = new TestProvider();
