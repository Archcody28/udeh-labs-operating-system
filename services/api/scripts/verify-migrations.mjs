import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const c = await pool.query("SELECT count(*)::int AS n FROM schema_migrations");
  console.log("applied migrations: " + c.rows[0].n);
  if (c.rows[0].n !== 23) {
    throw new Error("expected 23 migrations");
  }
  const r = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = '021_billing.sql'",
  );
  if (r.rowCount !== 1) {
    throw new Error("021_billing.sql not applied");
  }
  const n = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = '022_notifications_outbox.sql'",
  );
  if (n.rowCount !== 1) {
    throw new Error("022_notifications_outbox.sql not applied");
  }
  const o = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = '023_notifications_outbox_actor_fix.sql'",
  );
  if (o.rowCount !== 1) {
    throw new Error("023_notifications_outbox_actor_fix.sql not applied");
  }
  // The domain event actor is an opaque principal reference (TEXT), not a
  // users FK: agents and the "system" principal are legitimate actors.
  const col = await pool.query(
    `SELECT data_type FROM information_schema.columns
      WHERE table_name = 'domain_events' AND column_name = 'actor_user_id'`,
  );
  if (col.rowCount !== 1 || col.rows[0].data_type !== "text") {
    throw new Error("domain_events.actor_user_id must be TEXT");
  }
  console.log("migrations 021 + 022 + 023 verified");
} finally {
  await pool.end();
}
