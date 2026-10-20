import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const c = await pool.query("SELECT count(*)::int AS n FROM schema_migrations");
  console.log("applied migrations: " + c.rows[0].n);
  if (c.rows[0].n !== 21) {
    throw new Error("expected 21 migrations");
  }
  const r = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = '021_billing.sql'",
  );
  if (r.rowCount !== 1) {
    throw new Error("021_billing.sql not applied");
  }
  console.log("migration 021 verified");
} finally {
  await pool.end();
}
