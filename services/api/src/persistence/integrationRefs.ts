/** Integration account/resource/link persistence helpers. */
import { PoolClient } from "pg";
import { getPool } from "./db.js";
import { mapDbError } from "./baseRepository.js";

async function q(text: string, params: unknown[], tx?: PoolClient) {
  const r = tx ?? getPool();
  try { return await r.query(text, params as unknown[]); }
  catch (e) { throw mapDbError(e); }
}
export async function saveCredentialRef(iid: string, provider: string, name: string, ref: string, tx?: PoolClient) {
  const res = await q("INSERT INTO integration_credentials(integration_id, provider, credential_name, credential_reference) VALUES ($1,$2,$3,$4) RETURNING id, integration_id, provider, credential_name, status, version", [iid, provider, name, ref], tx);
  return res.rows[0];
}
export async function upsertAccount(iid: string, provider: string, ext: string, owner: string, label: string, cid: string, tx?: PoolClient) {
  const res = await q("INSERT INTO external_accounts(integration_id, provider, external_account_id, external_owner, account_label, correlation_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *", [iid, provider, ext, owner, label, cid], tx);
  if (res.rowCount) return res.rows[0];
  const cur = await q("SELECT * FROM external_accounts WHERE integration_id=$1 AND provider=$2 AND external_account_id=$3", [iid, provider, ext], tx);
  return cur.rows[0];
}
export async function listAccounts(iid: string, tx?: PoolClient) {
  const res = await q("SELECT id, integration_id, provider, external_account_id, external_owner, account_label, status, version FROM external_accounts WHERE integration_id=$1", [iid], tx);
  return res.rows;
}
export async function upsertResource(iid: string, aid: string, r: { provider: string; pid: string; owner: string; name: string; type: string }, cid: string, tx?: PoolClient) {
  const res = await q("INSERT INTO external_resources(integration_id, external_account_id, provider, provider_resource_id, resource_owner, resource_name, resource_type, correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING *", [iid, aid, r.provider, r.pid, r.owner, r.name, r.type, cid], tx);
  if (res.rowCount) return res.rows[0];
  const cur = await q("SELECT * FROM external_resources WHERE integration_id=$1 AND provider=$2 AND provider_resource_id=$3", [iid, r.provider, r.pid], tx);
  return cur.rows[0];
}
