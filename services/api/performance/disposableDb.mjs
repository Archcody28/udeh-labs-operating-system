// disposableDb.mjs - isolated disposable PostgreSQL database utility for Stage 2A
import { Pool } from "pg";
import crypto from "node:crypto";

const PREFIX = "udehlabs_perf_";

export function genDbName() {
  const suffix = crypto.randomBytes(8).toString("hex");
  return `${PREFIX}${suffix}`;
}

export function isValidTempDbName(name) {
  return typeof name === "string" && /^udehlabs_perf_[0-9a-f]{16}$/.test(name);
}

export function validateAdminUrl(adminUrl) {
  if (typeof adminUrl !== 'string' || adminUrl.trim() === '') throw new Error('missing administrator connection url');
  let u;
  try { u = new URL(adminUrl); } catch { throw new Error('invalid administrator connection url'); }
  if (!u.hostname) throw new Error('invalid administrator connection url');
  if (!u.username || !u.password) throw new Error('missing administrator credentials');
  if (u.pathname && u.pathname !== '/' && u.pathname !== '') {
    // allow any db segment but reject ambiguous multi-segment paths
    if (u.pathname.split('/').filter(Boolean).length > 1) throw new Error('ambiguous administrator connection url');
  }
  return u.toString();
}
export function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    if (u.username) u.username = "***";
    return u.toString();
  } catch {
    return String(url).replace(/:[^:@/]+@/, ":***@");
  }
}

export async function provision({ adminUrl, appConfig }) {
  const vAdminUrl = validateAdminUrl(adminUrl);
  if (!appConfig || typeof appConfig !== 'object' || !appConfig.username || !appConfig.password) throw new Error('missing application connection configuration');
  if (appConfig.username === 'udehlabs_dev') throw new Error('refuse development application user');
  const name = genDbName();
  const adminPool = new Pool({ connectionString: vAdminUrl });
  try {
    await adminPool.query(`CREATE DATABASE "${name}"`);
    // Connect to the new database as the admin (database owner) and grant the
    // application user sufficient privileges to run migrations and create schema
    // objects, without granting superuser or ownership.
    const adminDbPool = new Pool({ connectionString: vAdminUrl.replace(/\/[^\/]*$/, `/${name}`) });
    try {
      await adminDbPool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      await adminDbPool.query(`CREATE EXTENSION IF NOT EXISTS citext;`);
      await adminDbPool.query(`GRANT CREATE, USAGE ON SCHEMA public TO "${appConfig.username}"`);
    } finally {
      await adminDbPool.end();
    }
  } finally {
    await adminPool.end();
  }
  const u = new URL(vAdminUrl);
  u.username = appConfig.username;
  u.password = appConfig.password;
  u.pathname = '/' + name;
  return { name, url: u.toString(), adminUrl: vAdminUrl };
}

export async function migrate({ url, runner } = {}) {
  if (!url || typeof url !== 'string') throw new Error('missing application url');
  try {
    const m = runner ?? await import("../persistence/migrate.js");
    if (m && typeof m.migrateUp === "function") {
      const done = await m.migrateUp(url);
      if (!Array.isArray(done) || done.length === 0) throw new Error("migrations not applied");
      if (!done.every((f) => typeof f === "string" && f.length > 0)) throw new Error("migrations not applied");
      return { mechanism: "migrateUp", count: done.length, files: done };
    }
  } catch (e) {
    throw new Error(redactUrl(String(e?.message ?? e)));
  }
  throw new Error("real migration runner unavailable");
}

export async function drop({ name, adminUrl }) {
  if (name === "udehlabs_dev") throw new Error("refuse drop udehlabs_dev");
  if (!isValidTempDbName(name)) throw new Error("refuse drop non-temp db");
  const vAdminUrl = validateAdminUrl(adminUrl);
  const adminPool = new Pool({ connectionString: vAdminUrl });
  try {
    await adminPool.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()`, [name]);
    await adminPool.query(`DROP DATABASE IF EXISTS "${name}"`);
  } finally {
    await adminPool.end();
  }
}

export async function preflight({ adminUrl, appUrl } = {}) {
  const result = { version: null, role: null, rolcreatedb: null, targetDb: null, ok: false };
  const vAdminUrl = validateAdminUrl(adminUrl);
  let adminPool;
  try {
    adminPool = new Pool({ connectionString: vAdminUrl });
    const v = await adminPool.query("SELECT version()");
    result.version = v.rows?.[0]?.version ?? null;
    const r = await adminPool.query("SELECT current_user AS role, rolcreatedb FROM pg_roles WHERE rolname = current_user");
    result.role = r.rows?.[0]?.role ?? null;
    result.rolcreatedb = r.rows?.[0]?.rolcreatedb ?? null;
    if (appUrl) {
      const u = new URL(appUrl);
      result.targetDb = u.pathname.replace(/^\//, "") || null;
      if (result.targetDb === "udehlabs_dev") throw new Error("refuse application target udehlabs_dev");
    }
    result.ok = result.rolcreatedb === true;
    return result;
  } catch (e) {
    throw new Error(redactUrl(String(e?.message ?? e)));
  } finally {
    if (adminPool) await adminPool.end().catch(() => {});
  }
}

// Orchestration seam: release acquired resources in order, attempting all even on failure.
export async function cleanupFixtureResources({ app, closeApp, closePool, dropDb, verifyDrop } = {}) {
  const errors = [];
  const attempt = async (fn) => {
    try { await fn(); } catch (e) { errors.push(e); }
  };
  if (app && closeApp) await attempt(() => closeApp(app));
  if (closePool) await attempt(() => closePool());
  if (dropDb) await attempt(() => dropDb());
  if (verifyDrop) await attempt(() => verifyDrop());
  const redacted = errors.map((e) => new Error(redactUrl(String(e?.message ?? e))));
  if (redacted.length) {
    const err = new Error("fixture cleanup failed");
    err.cleanupErrors = redacted;
    throw err;
  }
  return { ok: true };
}

export function preservePrimaryError(primaryError, cleanupError) {
  const e = primaryError instanceof Error ? primaryError : new Error(String(primaryError));
  if (cleanupError) e.cleanupError = cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError));
  return e;
}

export async function runWithCleanup(main, cleanup) {
  let primaryError = null;
  let mainResult;
  try { mainResult = await main(); }
  catch (e) { primaryError = e; }
  let cleanupError = null;
  try { await cleanup(); } catch (e) { cleanupError = e; }
  if (primaryError) throw preservePrimaryError(primaryError, cleanupError);
  if (cleanupError) throw cleanupError;
  return mainResult;
}

