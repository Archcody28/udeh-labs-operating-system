import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { validateName } from "../domain/lifecycle.js";
import { validateEmail } from "../domain/credentials.js";

export interface UserRow {
  id: string; email: string | null; display_name: string; status: string; version: number;
}

/** Identity writer/reader. Password hashes live in user_credentials only. */
export class UserRepository extends BaseRepository {
  protected table = "users";

  async create(email: string | null, displayName: string, passwordHash: string | null, tx?: PoolClient): Promise<UserRow> {
    validateName(displayName, "display_name");
    const clean = email ? validateEmail(email) : null;
    if (!tx) {
      const { withTransaction } = await import("./db.js");
      return withTransaction((t) => this.create(email, displayName, passwordHash, t));
    }
    const res = await this.query(
      "INSERT INTO users(email, display_name) VALUES ($1,$2) RETURNING *",
      [clean, displayName.trim()], tx);
    if (passwordHash) {
      await this.query(
        "INSERT INTO user_credentials(user_id, password_hash) VALUES ($1,$2)",
        [(res.rows[0] as UserRow).id, passwordHash], tx);
    }
    return res.rows[0] as UserRow;
  }

  async findByEmail(email: string, tx?: PoolClient): Promise<(UserRow & { password_hash: string | null }) | null> {
    const res = await this.query(
      `SELECT u.*, c.password_hash FROM users u LEFT JOIN user_credentials c ON c.user_id = u.id
        WHERE u.email = $1`,
      [email.trim().toLowerCase()], tx);
    return (res.rows[0] as never) ?? null;
  }

  async findById(id: string, tx?: PoolClient): Promise<UserRow | null> {
    const res = await this.query("SELECT * FROM users WHERE id = $1", [id], tx);
    return (res.rows[0] as UserRow) ?? null;
  }

  async setPassword(userId: string, passwordHash: string, tx?: PoolClient): Promise<void> {
    await this.query(
      `INSERT INTO user_credentials(user_id, password_hash) VALUES ($1,$2)
        ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
      [userId, passwordHash], tx);
  }
}
