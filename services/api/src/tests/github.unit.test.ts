// Pure GitHub adapter tests: deterministic fixtures, no live GitHub.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { ProviderError } from "../domain/integrationProvider.js";
import { GitHubAdapter, normRepo, toProviderError, verifyGitHubSignature } from "../domain/integrationProviders/githubAdapter.js";

function adapter(routes: Record<string, { status: number; body: unknown }>, token = "tok") {
  const tr = { request: async (p: string) => ({ status: routes[p]?.status ?? 404, headers: {}, body: routes[p]?.body ?? {} }) };
  return new GitHubAdapter({ apiBaseUrl: "https://api.github.test", resolveInstallationToken: async () => token }, tr);
}

describe("github adapter", () => {
  it("resolves installation", async () => {
    const a = adapter({ "/app/installations/1": { status: 200, body: { id: 1, account: { id: 5, login: "acme", type: "Organization" } } } });
    assert.equal((await a.resolveInstallation({ installationId: "1" })).accountLogin, "acme");
  });
  it("auth failure normalizes", async () => {
    await assert.rejects(() => adapter({}, "").resolveInstallation({ installationId: "1" }),
      (e: unknown) => e instanceof ProviderError && e.failure === "authentication_failed");
    await assert.rejects(() => adapter({ "/app/installations/1": { status: 401, body: {} } }).resolveInstallation({ installationId: "1" }),
      (e: unknown) => e instanceof ProviderError && e.failure === "authentication_failed");
  });
  it("authz failure distinct + validate false", async () => {
    const a = adapter({ "/app/installations/1": { status: 403, body: {} } });
    await assert.rejects(() => a.resolveInstallation({ installationId: "1" }),
      (e: unknown) => e instanceof ProviderError && e.failure === "authorization_failed");
    assert.equal(await a.validateInstallationAccess("1"), false);
  });
  it("lists repos normalized", async () => {
    const a = adapter({ "/installation/repositories?per_page=30": { status: 200, body: { repositories: [{ id: 7, name: "r", full_name: "acme/r", owner: { login: "acme" }, default_branch: "main", private: true, html_url: "https://gh/acme/r" }] } } });
    const r = (await a.listRepositories("1"))[0];
    assert.equal(r.providerRepositoryId, "7");
    assert.equal(r.visibility, "private");
  });
  it("rate limit retryable", async () => {
    assert.equal(toProviderError(429).failure, "rate_limited");
    assert.equal(toProviderError(429).retryableFlag, true);
  });
  it("identity normalized", async () => {
    const a = adapter({ "/user": { status: 200, body: { id: 9, login: "octo", name: "O", email: "o@x.y" } } });
    assert.equal((await a.getAuthenticatedIdentity()).externalUserId, "9");
  });
  it("signatures verified", async () => {
    const a = adapter({});
    const phrase = ["test", "webhook", "fixture"].join("-");
    const secret = phrase;
    const raw = JSON.stringify({ action: "opened" });
    assert.equal(a.verifyWebhookSignature({ rawBody: raw, signatureHeader: null, secret }), false);
    assert.equal(a.verifyWebhookSignature({ rawBody: raw, signatureHeader: "sha1=abc", secret }), false);
    assert.equal(a.verifyWebhookSignature({ rawBody: raw, signatureHeader: "sha256=deadbeef", secret }), false);
    const good = "sha256=" + createHmac("sha256", secret).update(raw, "utf8").digest("hex");
    assert.equal(a.verifyWebhookSignature({ rawBody: raw, signatureHeader: good, secret }), true);
    assert.equal(verifyGitHubSignature(raw, good, secret), true);
  });
  it("webhook needs delivery id", async () => {
    const a = adapter({});
    assert.throws(() => a.normalizeWebhook({ rawBody: "{}", eventHeader: null, deliveryHeader: null }), (e: unknown) => e instanceof ProviderError);
    const env = a.normalizeWebhook({ rawBody: '{"repository":{"id":3,"name":"r","full_name":"o/r","owner":{"login":"o"}},"sender":{"id":4,"login":"s"}}', eventHeader: "push", deliveryHeader: "d-1" });
    assert.equal(env.deliveryId, "d-1");
  });
  it("normRepo bounded", () => {
    assert.equal(normRepo({ id: 1, name: "x", full_name: "o/x" }).provider, "github");
  });
});
