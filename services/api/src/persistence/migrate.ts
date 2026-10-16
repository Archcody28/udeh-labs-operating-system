import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

/**
 * Migration runner: ordered *.sql files, schema_migrations journal.
 * Usage: node dist/persistence/migrate.js [up|down|reset-note]
 * Down = documented per-file rollback notes; destructive reset only via explicit env flag.
 */
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "migrations");

export async function migrateUp(databaseUrl: string): Promise<string[]> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    const applied = new Set(
      (await pool.query("SELECT version FROM schema_migrations")).rows.map((r: { version: string }) => r.version)
    );
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    const done: string[] = [];
    for (const f of files) {
      if (applied.has(f)) continue;
      const sql = readFileSync(join(dir, f), "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query("INSERT INTO schema_migrations(version) VALUES ($1)", [f]);
        await pool.query("COMMIT");
        done.push(f);
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }
    return done;
  } finally {
    await pool.end();
  }
}

const isMain = process.argv[1]?.endsWith("migrate.js");
if (isMain) {
  const url = process.env.DATABASE_URL ?? "postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev";
  migrateUp(url).then(
    (done) => { console.log(`migrations applied: ${done.length} ${done.join(", ")}`); },
    (err) => { console.error("migration failed", err); process.exit(1); }
  );
}
