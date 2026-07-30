import express from "express";
import { timingSafeEqual } from "crypto";
import { config } from "./config";
import { createSalesOrder, logSyncException } from "./bcClient";
import { createFileJobStore } from "./jobStore";
import { SyncService } from "./syncService";
import { releaseToWms } from "./wmsClient";
import { WebshopOrder } from "./types";

const app = express();
app.use(express.json());

function requiresApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Empty is deliberately allowed only for the existing local-only quickstart.
  // Never expose a tunnel or hosted instance until INTEGRATION_API_KEY is set.
  if (!config.integrationApiKey) return next();
  const supplied = req.header("x-api-key") ?? "";
  const expected = config.integrationApiKey;
  const valid = supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: "Invalid or missing API key" });
  return next();
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mockMode: config.mockMode, retryWorker: "POST /operations/retry-due" });
});

const syncService = new SyncService(createFileJobStore(config.integrationStatePath), {
  createSalesOrder,
  logSyncException,
  releaseToWms: config.wmsUrl ? (company, order) => releaseToWms(config.wmsUrl, company, order) : undefined,
});

app.post("/webshop-order", requiresApiKey, async (req, res) => {
  const order = req.body as WebshopOrder;
  try {
    const received = syncService.receive(order);
    if (received.duplicate) {
      return res.status(200).json({ status: "duplicate", idempotencyKey: received.job.idempotencyKey, job: received.job });
    }
    const job = await syncService.process(received.job.idempotencyKey);
    const status = job.status === "completed" ? 201 : job.status === "retryScheduled" ? 202 : 422;
    return res.status(status).json({ status: job.status, idempotencyKey: job.idempotencyKey, job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[webshop-sync] order ${order?.orderReference ?? "unknown"} failed: ${message}`);
    return res.status(422).json({ status: "failed", reason: message });
  }
});

app.get("/operations/:key", requiresApiKey, (req, res) => {
  const job = createFileJobStore(config.integrationStatePath).get(req.params.key);
  return job ? res.json(job) : res.status(404).json({ error: "Not found" });
});

app.post("/operations/:key/reprocess", requiresApiKey, async (req, res) => {
  try {
    const job = await syncService.reprocess(req.params.key);
    return res.status(job.status === "completed" ? 200 : 202).json(job);
  } catch (error) {
    return res.status(422).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

app.post("/operations/retry-due", requiresApiKey, async (_req, res) => {
  const jobs = await syncService.processDue();
  return res.json({ processed: jobs.length, jobs });
});

app.listen(config.port, () => {
  console.log(`webshop-sync listening on :${config.port} (mockMode=${config.mockMode})`);
});
