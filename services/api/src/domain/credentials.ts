/**
 * Credential + token primitives (ADR 0013). Node built-ins only.
 * - Passwords: scrypt(N=16384, r=8, p=1, 64B) + 16B salt, timingSafeEqual.
 * - Opaque session/invitation tokens: 256-bit random; SHA-256 stored.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash, ScryptOptions } from "node:crypto";
import { promisify } from "node:util";
import { ValidationError } from "./errors.js";

const scryptAsync = promisify<string | Buffer, string | Buffer, number, ScryptOptions, Buffer>(scryptCb as never);
const SCRYPT_OPTS: ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export function validatePasswordPolicy(password: string): void {
  if (typeof password !== "string" || password.length < 12 || password.length > 256) {
    throw new ValidationError("password must be 12..256 characters",
      [{ field: "password", issue: "must be 12..256 characters" }]);
  }
}

export function validateEmail(email: string): string {
  const v = email.trim().toLowerCase();
  if (!/^[^\s@]{1,200}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(v) || v.length > 320) {
    throw new ValidationError("invalid email", [{ field: "email", issue: "invalid" }]);
  }
  return v;
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);
  const salt = randomBytes(16);
  const key = (await scryptAsync(password, salt, 64, SCRYPT_OPTS)) as Buffer;
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    const key = (await scryptAsync(password, salt, 64, SCRYPT_OPTS)) as Buffer;
    if (key.length !== expected.length) return false;
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

/** 256-bit opaque token for transport; returns { token, tokenHash }. */
export function newOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: sha256Hex(token) };
}

export function sha256Hex(v: string): string {
  return createHash("sha256").update(v, "utf8").digest("hex");
}
