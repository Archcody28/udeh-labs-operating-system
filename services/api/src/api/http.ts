import { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { toEnvelope } from "../domain/errors.js";

export function correlationIdOf(req: IncomingMessage): string {
  const h = req.headers["x-correlation-id"];
  const v = Array.isArray(h) ? h[0] : h;
  return v && v.trim() ? v.trim().slice(0, 100) : randomUUID();
}

export function sendJson(res: ServerResponse, status: number, body: unknown, correlationId: string): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "x-correlation-id": correlationId,
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

export function sendError(res: ServerResponse, err: unknown, correlationId: string): void {
  // Never leak stack/secrets: envelope only.
  const { status, body } = toEnvelope(err, correlationId);
  sendJson(res, status, body, correlationId);
}

export function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1_000_000) reject(new Error("body too large")); });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw) as Record<string, unknown>); }
      catch { reject(new Error("invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

/** Cursor pagination envelope per docs/api/query-conventions.md (illustrative shape). */
export function page<T>(data: T[], nextCursor: string | null, limit: number) {
  return { data, page: { nextCursor, prevCursor: null, limit }, meta: {} };
}
