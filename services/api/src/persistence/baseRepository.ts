import { PoolClient } from "pg";
import { getPool } from "./db.js";
import { ConflictError, NotFoundError } from "../domain/errors.js";

/** Base repository: parameterized queries, tenant scoping, error mapping. */
export abstract class BaseRepository {
  protected abstract table: string;

  protected async query(text: string, params: unknown[], tx?: PoolClient) {
    const runner = tx ?? getPool();
    try {
      return await runner.query(text, params as unknown[]);
    } catch (err) {
      throw mapDbError(err);
    }
  }

  protected async findByIdInOrg<T>(id: string, organizationId: string, tx?: PoolClient): Promise<T> {
    const res = await this.query("SELECT * FROM " + this.table + " WHERE id = $1 AND organization_id = $2", [id, organizationId], tx);
    if (res.rowCount === 0) throw new NotFoundError(this.table);
    return res.rows[0] as T;
  }

  /**
   * Nullable tenant read for routes that must not oracle existence.
   * Returns null when the row is outside the caller's tenant; the route
   * maps that to 403 (never a raw 404 that leaks cross-tenant existence).
   */
  protected async findOwnedInOrg<T>(id: string, organizationId: string, tx?: PoolClient): Promise<T | null> {
    const res = await this.query("SELECT * FROM " + this.table + " WHERE id = $1 AND organization_id = $2", [id, organizationId], tx);
    return (res.rows[0] as T) ?? null;
  }
}

export function mapDbError(err: unknown): Error {
  const e = err as { code?: string; detail?: string; constraint?: string };
  if (e && typeof e.code === "string") {
    if (e.code === "23505") return new ConflictError(`duplicate: ${e.constraint ?? "unique constraint"}`);
    if (e.code === "23503") return new ConflictError(`referenced record missing: ${e.constraint ?? "foreign key"}`);
    if (e.code === "23514") return new ConflictError(`check constraint violated: ${e.constraint ?? "check"}`);
  }
  return err as Error;
}

/** Optimistic-concurrency update helper: UPDATE ... WHERE id=$ AND version=$. */
export async function updateWithVersion(
  table: string,
  id: string,
  version: number,
  patch: Record<string, unknown>,
  tx?: PoolClient
) {
  const keys = Object.keys(patch);
  const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");
  const sql = `UPDATE ${table} SET ${sets}, version = version + 1, updated_at = now()
     WHERE id = $1 AND version = $2 RETURNING *`;
  const runner = tx ?? getPool();
  try {
    const res = await runner.query(sql, [id, version, ...keys.map((k) => patch[k])] as unknown[]);
    if (res.rowCount === 0) throw new ConflictError(`${table}: stale version or missing (expected ${version})`);
    return res.rows[0];
  } catch (err) {
    if (err instanceof ConflictError) throw err;
    throw mapDbError(err);
  }
}
