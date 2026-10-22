import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { closePool } from "../persistence/db.ts";
import { migrateUp } from "../persistence/migrate.ts";
import { correlationIdOf, sendError } from "../api/http.ts";
import { loadConfig } from "../config.ts";
import { handleRoute } from "./routes.ts";
import { bootstrapNotificationProviders } from "../domain/notificationBootstrap.ts";
import { startDispatchWorker, recoverStaleClaims } from "../domain/notificationService.ts";
import { instrumentRequest } from "../observability/http.ts";
import { setupObservability } from "../observability/setup.ts";
import { log } from "../observability/logger.ts";
import { closeServer, installSignalHandlers } from "./shutdown.ts";

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
  const server = createServer((req, res) => { void route(req, res); });
  // Socket-level deadlines. Without them a client that opens a connection and
  // never sends a request (or trickles one) pins a socket and, eventually, a
  // file descriptor for the lifetime of the process. These bound the damage
  // of a slow or hostile client without affecting normal traffic.
  server.requestTimeout = 30_000;
  server.headersTimeout = 20_000;
  // Keep-alive sockets must not outlive the shutdown drain either.
  server.keepAliveTimeout = 10_000;
  return server;
}

const isMain = (process.argv[1] ?? "").endsWith("server.js");
if (isMain) {
  const cfg = loadConfig();
  process.env.DATABASE_URL = cfg.databaseUrl;
  migrateUp(cfg.databaseUrl).then(
    async () => {
      setupObservability();
      bootstrapNotificationProviders();

      // Startup recovery: reclaim rows abandoned by a crash or an unclean
      // shutdown. This runs BEFORE the worker starts so no row is stranded
      // behind an expired lease. A failure here is logged but does not
      // prevent startup - the worker's own lease expiry reclaims those rows
      // anyway, so a transient database error must not cause an outage.
      try {
        await recoverStaleClaims();
      } catch (err) {
        try {
          log.error("notification.startup_recovery_failed", "startup recovery failed", {
            error_code: (err as { code?: string } | null)?.code ?? "unknown"
          });
        } catch {
          // FAIL OPEN
        }
      }

      // The dispatcher may run in-process or in a separate worker deployment.
      // NOTIFICATION_WORKER_ENABLED=false keeps the API read/write path only.
      const worker = cfg.notificationWorker.enabled
        ? startDispatchWorker({
            intervalMs: cfg.notificationWorker.intervalMs,
            batchSize: cfg.notificationWorker.batchSize,
            providerTimeoutMs: cfg.notificationWorker.providerTimeoutMs,
            leaseMs: cfg.notificationWorker.leaseMs,
          })
        : { stop: async () => { /* worker not started in this process */ } };
      const server = createApp().listen(cfg.port, () => {
        try {
          log.info("server.listening", "api listening", { port: cfg.port });
        } catch {
          // FAIL OPEN
        }
      });

      // Graceful shutdown: stop accepting traffic, drain in-flight work,
      // release the pool, then exit. A second signal forces the exit.
      installSignalHandlers(
        [
          { name: "stop_http", run: () => closeServer(server) },
          { name: "stop_worker", run: () => worker.stop() },
          { name: "close_pool", run: () => closePool() },
        ],
        {
          timeoutMs: cfg.shutdownTimeoutMs,
          onExit: (code) => {
            process.exit(code);
          }
        }
      );
    },
    (e: unknown) => {
      console.error("migrate failed", e);
      process.exit(1);
    }
  );
}
