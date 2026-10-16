import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { getPool, closePool } from "../persistence/db.js";
import { migrateUp } from "../persistence/migrate.js";
import { correlationIdOf, sendError } from "../api/http.js";
import { loadConfig } from "../config.js";
import { handleRoute } from "./routes.js";

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cid = correlationIdOf(req);
  try {
    await handleRoute(req, res, cid);
  } catch (err) {
    sendError(res, err, cid);
  }
}

export function createApp() {
  return createServer((req, res) => { void route(req, res); });
}

const isMain = (process.argv[1] ?? "").endsWith("server.js");
if (isMain) {
  const cfg = loadConfig();
  process.env.DATABASE_URL = cfg.databaseUrl;
  migrateUp(cfg.databaseUrl).then(
    () => createApp().listen(cfg.port, () => console.log(`api listening :${cfg.port}`)),
    (e: unknown) => { console.error("migrate failed", e); process.exit(1); }
  );
  for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { void closePool().then(() => process.exit(0)); });
}
