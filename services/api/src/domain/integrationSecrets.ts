/** Secret vault abstraction: app code holds references, never raw secrets. */
export interface SecretVault {
  put(ref: string, value: string): Promise<void>;
  get(ref: string): Promise<string | null>;
  revoke(ref: string): Promise<void>;
}

export class EnvSecretVault implements SecretVault {
  private mem = new Map<string, string>();
  async put(ref: string, value: string): Promise<void> {
    if (!ref) throw new Error("ref required");
    this.mem.set(ref, value);
  }
  async get(ref: string): Promise<string | null> {
    if (process.env[ref] != null) return process.env[ref] as string;
    return this.mem.get(ref) ?? null;
  }
  async revoke(ref: string): Promise<void> { this.mem.delete(ref); }
}

let vault: SecretVault = new EnvSecretVault();
export function setSecretVault(v: SecretVault): void { vault = v; }
export function secretVault(): SecretVault { return vault; }

/** Redact any credential-looking material from objects destined for logs/audit/API. */
export function sanitizeForAudit(v: unknown): unknown {
  const banned = /token|secret|private[_-]?key|password|authorization|bearer|session|cookie/i;
  if (Array.isArray(v)) return v.map(sanitizeForAudit);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = banned.test(k) ? "[redacted]" : sanitizeForAudit(val);
    }
    return out;
  }
  if (typeof v === "string" && /^(gh[pousr]_|sk-|xox[bap]-|Bearer )/i.test(v)) return "[redacted]";
  return v;
}
