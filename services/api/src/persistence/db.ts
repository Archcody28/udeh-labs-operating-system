import { Pool, PoolClient } from "pg";

/** Single pooled entry point. No raw client leaks outside repositories. */
let pool: Pool | null = null;

export function getPool(databaseUrl?: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl ?? process.env.DATABASE_URL,
      max: Number(process.env.PGPOOL_MAX ?? "10"),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type TxClient = PoolClient;

/** Explicit transaction boundary. Caller owns the semantics; see transaction-conventions.md. */
export async function withTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* best effort */
    }
    throw err;
  } finally {
    client.release();
  }
}
