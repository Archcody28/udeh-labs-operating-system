import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ADMIN_URL = process.env.ADMIN_DATABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Derive application credentials from DATABASE_URL for use with provision().
 * Administrator credentials (ADMIN_URL) are used only for disposable DB
 * administration; application credentials come from DATABASE_URL and are used
 * for application connections and migrations.
 */
function appConfigFromDatabaseUrl(): { username: string; password: string } | null {
  if (!DATABASE_URL || typeof DATABASE_URL !== 'string') return null;
  let u: URL;
  try { u = new URL(DATABASE_URL); } catch { return null; }
  if (!u.username || !u.password) return null;
  return { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) };
}

test('disposable auth fixture lifecycle (skipped if no DB)', { skip: !process.env.DATABASE_URL || !process.env.ADMIN_DATABASE_URL }, async () => {
  const { provision, migrate, drop, preflight } = await import(
    new URL('../performance/disposableDb.mjs', import.meta.url).href
  );
  const { createApp } = await import('../app/server.js');
  const { closePool } = await import('../persistence/db.js');

  const appConfig = appConfigFromDatabaseUrl();
  assert.ok(appConfig, 'DATABASE_URL must contain application credentials for provisioning');

  await preflight({ adminUrl: ADMIN_URL });
  const { name, url } = await provision({ adminUrl: ADMIN_URL, appConfig });
  let app: any;
  let token = '';
  try {
    const mig = await migrate({ url });
    assert.ok(mig.count > 0, 'migration completed');
    app = createApp();
    await new Promise<void>((r) => app.listen(0, '127.0.0.1', r));
    const port = (app.address() as { port: number }).port;
    const base = `http://127.0.0.1:${port}`;
    const email = `perf-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomBytes(16).toString('hex');
    const regRes = await fetch(`${base}/api/v1/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, displayName: 'Perf User' }) });
    assert.equal(regRes.status, 201);
    const regJson: any = await regRes.json();
    const loginRes = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    assert.equal(loginRes.status, 200);
    const loginJson: any = await loginRes.json();
    token = loginJson.data.token;
    const meRes = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${token}` } });
    assert.ok(meRes.ok, `/me should be successful, got ${meRes.status}`);
    const meJson: any = await meRes.json();
    assert.ok(meJson && meJson.data, 'me response body should contain data');
    assert.ok(typeof meJson.data.subjectId === 'string' && meJson.data.subjectId.length > 0, 'me data.subjectId should be a non-empty string');
    await fetch(`${base}/api/v1/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  } finally {
    if (app) await new Promise<void>((r) => app.close(() => r()));
    try { await closePool(); } catch {}
    await drop({ name, adminUrl: ADMIN_URL });
    const adminPool = new (await import('pg')).Pool({ connectionString: ADMIN_URL });
    const r = await adminPool.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]);
    await adminPool.end();
    assert.equal(r.rowCount, 0, 'db dropped');
  }
});
