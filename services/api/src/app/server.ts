import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { getPool, closePool } from "../persistence/db.js";
import { migrateUp } from "../persistence/migrate.js";
import { correlationIdOf, sendError } from "../api/http.js";
import { loadConfig } from "../config.js";
import { handleRoute } from "./routes.js";
import { bootstrapNotificationProviders } from "../domain/notificationBootstrap.js";
import { startDispatchWorker } from "../domain/notificationService.js";
import { instrumentRequest } from "../observability/http.js";
import { setupObservability } from "../observability/setup.js";

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cid = correlationIdOf(req);
  const boundHandler = (r: IncomingMessage, response: ServerResponse) =>
    handleRoute(r, response, cid);
  try {
    await instrumentRequest(req, res, boundHandler);
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
    () => {
      setupObservability();
      bootstrapNotificationProviders();
      // The dispatcher may run in-process or in a separate worker deployment.
      // NOTIFICATION_WORKER_ENABLED=false keeps the API read/write path only.
      const worker = cfg.notificationWorker.enabled
        ? startDispatchWorker({
            intervalMs: cfg.notificationWorker.intervalMs,
            batchSize: cfg.notificationWorker.batchSize,
          })
        : { stop: () => { /* worker not started in this process */ } };
      const server = createApp().listen(cfg.port, () => console.log(`api listening :${cfg.port}`));
      for (const s of ["SIGINT", "SIGTERM"]) {
        process.on(s, () => {
          worker.stop();
          void closePool().then(() => server.close(() => process.exit(0)));
        });
      }
    },
    (e: unknown) => { console.error("migrate failed", e); process.exit(1); }
  );
}
