/** GitHub adapter: first concrete IntegrationProvider.
 * ONLY module allowed to understand GitHub API shapes. Normalizes everything
 * to provider-neutral structures; never leaks SDK/HTTP internals.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  IntegrationProvider, ProviderAccount, ProviderError, ProviderIdentity,
  ProviderRepository, ProviderTransport, ProviderWebhookEnvelope, registerProvider,
} from "../integrationProvider.js";

export interface GitHubAdapterConfig {
  apiBaseUrl: string;
  resolveInstallationToken: (installationId: string) => Promise<string>;
}

export interface GhRepo {
  id: number; name: string; full_name: string; owner?: { login?: string };
  default_branch?: string; private?: boolean; html_url?: string;
}

export function normRepo(gh: GhRepo): ProviderRepository {
  const [owner, name] = String(gh.full_name ?? "/").split("/");
  return {
    provider: "github",
    providerRepositoryId: String(gh.id),
    owner: gh.owner?.login ?? owner ?? "",
    name: gh.name ?? name ?? "",
    fullName: String(gh.full_name ?? ""),
    defaultBranch: gh.default_branch ?? null,
    visibility: gh.private === true ? "private" : gh.private === false ? "public" : "unknown",
    externalUrl: gh.html_url ?? null,
  };
}

export function toProviderError(status: number): ProviderError {
  if (status === 401) return new ProviderError({ provider: "github", failure: "authentication_failed", message: "github authentication failed" });
  if (status === 403) return new ProviderError({ provider: "github", failure: "authorization_failed", message: "github authorization failed" });
  if (status === 404) return new ProviderError({ provider: "github", failure: "not_found", message: "github resource not found" });
  if (status === 422) return new ProviderError({ provider: "github", failure: "validation_failed", message: "github validation failed" });
  if (status === 429) return new ProviderError({ provider: "github", failure: "rate_limited", message: "github rate limited", retryable: true });
  if (status >= 500) return new ProviderError({ provider: "github", failure: "retryable_transport", message: "github transport failure", retryable: true });
  return new ProviderError({ provider: "github", failure: "provider_unavailable", message: "github unavailable" });
}

export function verifyGitHubSignature(raw: string, sig: string | null, secret: string): boolean {
  if (!sig || !secret) return false;
  const m = sig.match(/^sha256=([0-9a-fA-F]+)$/);
  if (!m) return false;
  const e = Buffer.from(createHmac("sha256", secret).update(raw, "utf8").digest("hex"), "utf8");
  const a = Buffer.from(m[1], "utf8");
  if (e.length !== a.length) return false;
  return timingSafeEqual(e, a);
}
export class GitHubAdapter implements IntegrationProvider {
  readonly name = "github";
  constructor(private cfg: GitHubAdapterConfig, private tr?: ProviderTransport) {}
  private async call(inst: string, path: string) {
    if (!this.tr) throw new ProviderError({ provider: "github", failure: "provider_unavailable", message: "no github transport configured" });
    let tok = "";
    try { tok = await this.cfg.resolveInstallationToken(inst); } catch { tok = ""; }
    if (!tok) throw new ProviderError({ provider: "github", failure: "authentication_failed", message: "github installation authentication failed" });
    void tok;
    if (!path.startsWith("/") || path.includes("..") || /^https?:\/\//i.test(path)) {
      throw new ProviderError({ provider: "github", failure: "validation_failed", message: "unsafe provider path" });
    }
    let res;
    try { res = await this.tr.request(path, { method: "GET" }); }
    catch { throw new ProviderError({ provider: "github", failure: "retryable_transport", message: "github transport failure", retryable: true }); }
    if (res.status !== 200) throw toProviderError(res.status);
    return res;
  }
  async resolveInstallation(input: { installationId: string }): Promise<ProviderAccount> {
    const res = await this.call(input.installationId, `/app/installations/${encodeURIComponent(input.installationId)}`);
    const b = res.body as { id?: number; account?: { id?: number; login?: string; type?: string } };
    if (!b || typeof b !== "object" || !b.account?.login) throw new ProviderError({ provider: "github", failure: "validation_failed", message: "malformed github installation payload" });
    return { provider: "github", installationId: String(b.id ?? input.installationId), accountId: String(b.account.id ?? ""), accountLogin: String(b.account.login), accountType: String(b.account.type ?? "Organization"), displayName: String(b.account.login) };
  }
  async getAuthenticatedIdentity(): Promise<ProviderIdentity> {
    if (!this.tr) throw new ProviderError({ provider: "github", failure: "provider_unavailable", message: "no github transport configured" });
    let res;
    try { res = await this.tr.request("/user", { method: "GET" }); }
    catch { throw new ProviderError({ provider: "github", failure: "retryable_transport", message: "github transport failure", retryable: true }); }
    if (res.status !== 200) throw toProviderError(res.status);
    const b = res.body as { id?: number; login?: string; name?: string; email?: string };
    if (!b?.login || b.id == null) throw new ProviderError({ provider: "github", failure: "validation_failed", message: "malformed github identity" });
    return { provider: "github", externalUserId: String(b.id), login: String(b.login), displayName: b.name ?? null, email: b.email ?? null };
  }
  async validateInstallationAccess(id: string): Promise<boolean> {
    try { await this.resolveInstallation({ installationId: id }); return true; }
    catch (e) {
      if (e instanceof ProviderError && ["authentication_failed", "authorization_failed", "not_found"].includes(e.failure)) return false;
      throw e;
    }
  }
  async listRepositories(inst: string, opts?: { limit?: number }): Promise<ProviderRepository[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100);
    const res = await this.call(inst, `/installation/repositories?per_page=${limit}`);
    const b = res.body as { repositories?: GhRepo[] };
    if (!Array.isArray(b?.repositories)) throw new ProviderError({ provider: "github", failure: "validation_failed", message: "malformed github repository list" });
    return b.repositories.slice(0, limit).map(normRepo);
  }
  async getRepository(inst: string, repo: { owner: string; name: string } | { providerRepositoryId: string }): Promise<ProviderRepository> {
    const p = "owner" in repo ? `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}` : `/repositories/${encodeURIComponent(repo.providerRepositoryId)}`;
    const res = await this.call(inst, p);
    return normRepo(res.body as GhRepo);
  }
  verifyWebhookSignature(a: { rawBody: string; signatureHeader: string | null; secret: string }): boolean {
    return verifyGitHubSignature(a.rawBody, a.signatureHeader, a.secret);
  }
  normalizeWebhook(a: { rawBody: string; eventHeader: string | null; deliveryHeader: string | null }): ProviderWebhookEnvelope {
    if (!a.eventHeader || !a.deliveryHeader) throw new ProviderError({ provider: "github", failure: "validation_failed", message: "missing github event identity" });
    let p: Record<string, unknown>;
    try { p = JSON.parse(a.rawBody) as Record<string, unknown>; }
    catch { throw new ProviderError({ provider: "github", failure: "validation_failed", message: "malformed github webhook payload" }); }
    const r = p.repository as GhRepo | undefined;
    const s = p.sender as { id?: number; login?: string } | undefined;
    return { provider: "github", eventType: a.eventHeader, eventId: `${a.eventHeader}:${a.deliveryHeader}`, deliveryId: a.deliveryHeader, occurredAt: null, repository: r?.id != null ? { providerRepositoryId: String(r.id), owner: String(r.owner?.login ?? ""), name: String(r.name ?? "") } : null, sender: s?.id != null && s?.login ? { externalUserId: String(s.id), login: String(s.login) } : null };
  }
}
export function registerGitHubAdapter(cfg: GitHubAdapterConfig, tr?: ProviderTransport): GitHubAdapter {
  const a = new GitHubAdapter(cfg, tr);
  registerProvider(a);
  return a;
}

