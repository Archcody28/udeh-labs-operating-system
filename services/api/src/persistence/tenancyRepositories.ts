import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { validateName, assertTransition } from "../domain/lifecycle.js";
import { TenantContext } from "../domain/tenancy.js";
import { withTransaction } from "./db.js";

export interface Organization { id: string; name: string; slug: string; status: string; version: number; }

/**
 * Tenant-owned repository rule (Phase 7): organizations are only readable
 * through membership scope. `findById` (unscoped) is intentionally absent —
 * callers must use `findForMember` so a direct repository call can never
 * bypass tenant filtering. `create`/`setStatus` remain privileged
 * service-internal operations (creation is followed by membership insert in
 * the same transaction; status changes are owner-only service calls).
 */

export class OrganizationRepository extends BaseRepository {
  protected table = "organizations";

  async create(name: string, slug: string, tx?: PoolClient): Promise<Organization> {
    validateName(name); validateName(slug, "slug");
    const res = await this.query(
      "INSERT INTO organizations(name, slug, status) VALUES ($1,$2,'active') RETURNING *",
      [name.trim(), slug.trim().toLowerCase()], tx);
    return res.rows[0] as Organization;
  }

  async createWithPrimaryWorkspace(name: string, slug: string, workspaceName = "Primary") {
    return withTransaction(async (tx) => {
      const org = await this.create(name, slug, tx);
      const wsRepo = new WorkspaceRepository();
      const ctx = { organizationId: org.id, correlationId: "seed" } as TenantContext;
      const workspace = await wsRepo.create(ctx, workspaceName, slug + "-primary", true, tx);
      return { org, workspace };
    });
  }

  async findForMember(id: string, userId: string, tx?: PoolClient): Promise<Organization> {
    const res = await this.query(
      `SELECT o.* FROM organizations o JOIN memberships m ON m.organization_id = o.id
        WHERE o.id = $1 AND m.user_id = $2 AND m.status = 'active'`, [id, userId], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("organizations");
    return res.rows[0] as Organization;
  }

  async setStatus(id: string, version: number, to: string, tx?: PoolClient): Promise<Organization> {
    const res = await this.query("SELECT * FROM organizations WHERE id = $1", [id], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("organizations");
    const cur = res.rows[0] as Organization;
    assertTransition("organization", cur.status, to);
    return (await updateWithVersion("organizations", id, version, { status: to }, tx)) as Organization;
  }
}

export interface Workspace { id: string; organization_id: string; name: string; slug: string; is_primary: boolean; status: string; version: number; }

export class WorkspaceRepository extends BaseRepository {
  protected table = "workspaces";

  async create(ctx: TenantContext, name: string, slug: string, isPrimary = false, tx?: PoolClient): Promise<Workspace> {
    validateName(name);
    const res = await this.query(
      "INSERT INTO workspaces(organization_id, name, slug, is_primary) VALUES ($1,$2,$3,$4) RETURNING *",
      [ctx.organizationId, name.trim(), slug.trim().toLowerCase(), isPrimary], tx);
    return res.rows[0] as Workspace;
  }

  async findById(ctx: TenantContext, id: string, tx?: PoolClient): Promise<Workspace> {
    return this.findByIdInOrg<Workspace>(id, ctx.organizationId, tx);
  }

  async list(ctx: TenantContext, limit = 20): Promise<Workspace[]> {
    const safe = Math.min(Math.max(limit, 1), 100);
    const res = await this.query("SELECT * FROM workspaces WHERE organization_id = $1 ORDER BY id LIMIT $2",
      [ctx.organizationId, safe]);
    return res.rows as Workspace[];
  }

  async archive(ctx: TenantContext, id: string, version: number, tx?: PoolClient): Promise<Workspace> {
    const cur = await this.findById(ctx, id, tx);
    assertTransition("workspace", cur.status, "archived");
    const res = await this.query(
      "UPDATE workspaces SET status='archived', version=version+1, updated_at=now() WHERE id=$1 AND organization_id=$2 AND version=$3 RETURNING *",
      [id, ctx.organizationId, version], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).ConflictError("workspaces: stale version");
    return res.rows[0] as Workspace;
  }
}
