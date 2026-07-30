import fs from "fs";
import path from "path";
import { IntegrationJob, WebshopOrder } from "./types";

export interface JobStore {
  get(key: string): IntegrationJob | undefined;
  save(job: IntegrationJob): IntegrationJob;
  list(): IntegrationJob[];
}

export function idempotencyKey(order: WebshopOrder): string {
  return [order.brand, order.webshopCountry, order.orderReference]
    .map((part) => (part ?? "").trim().toUpperCase())
    .join("::");
}

export function createMemoryJobStore(): JobStore {
  const jobs = new Map<string, IntegrationJob>();
  return {
    get: (key) => jobs.get(key),
    save: (job) => {
      jobs.set(job.idempotencyKey, { ...job });
      return job;
    },
    list: () => [...jobs.values()],
  };
}

// A small file-backed store keeps the demo replay-safe across a service
// restart. In production this interface maps to a table with a unique index on
// idempotencyKey; the file is deliberately ignored because it can contain PII.
export function createFileJobStore(filePath: string): JobStore {
  let loaded = false;
  const jobs = new Map<string, IntegrationJob>();

  function load() {
    if (loaded) return;
    loaded = true;
    if (!fs.existsSync(filePath)) return;
    const rows = JSON.parse(fs.readFileSync(filePath, "utf8")) as IntegrationJob[];
    rows.forEach((job) => jobs.set(job.idempotencyKey, job));
  }

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify([...jobs.values()], null, 2));
    fs.renameSync(temporaryPath, filePath);
  }

  return {
    get(key) {
      load();
      return jobs.get(key);
    },
    save(job) {
      load();
      jobs.set(job.idempotencyKey, { ...job });
      persist();
      return job;
    },
    list() {
      load();
      return [...jobs.values()];
    },
  };
}
