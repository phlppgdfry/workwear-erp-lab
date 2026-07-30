import { config } from "./config";
import { classifyError, retryAt } from "./errorPolicy";
import { idempotencyKey, JobStore } from "./jobStore";
import { InvalidOrderError, resolveCompany, toBcSalesOrder } from "./transformOrder";
import { IntegrationJob, WebshopOrder } from "./types";
import { releaseToWms, WmsShipment } from "./wmsClient";

export interface SyncDependencies {
  createSalesOrder: (companyName: string, payload: ReturnType<typeof toBcSalesOrder>) => Promise<any>;
  logSyncException: (companyName: string, exception: unknown) => Promise<any>;
  releaseToWms?: (companyName: string, order: WebshopOrder) => Promise<WmsShipment>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export class SyncService {
  constructor(
    private readonly store: JobStore,
    private readonly dependencies: SyncDependencies,
    private readonly brandCompanyMap: Record<string, string> = config.brandCompanyMap
  ) {}

  receive(order: WebshopOrder): { job: IntegrationJob; duplicate: boolean } {
    if (!order?.orderReference) throw new InvalidOrderError("Missing orderReference");
    const key = idempotencyKey(order);
    const existing = this.store.get(key);
    // A delivery is never permission to resurrect a dead letter. That is a
    // conscious key-user decision through reprocess(), otherwise a webhook
    // provider's own retry could bypass approval and duplicate side effects.
    if (existing) return { job: existing, duplicate: true };

    const now = new Date().toISOString();
    const job: IntegrationJob = { idempotencyKey: key, order, status: "received", attemptCount: 0, createdAt: now, updatedAt: now };
    this.store.save(job);
    return { job, duplicate: false };
  }

  async process(key: string): Promise<IntegrationJob> {
    const job = this.store.get(key);
    if (!job) throw new Error(`No integration job found for ${key}`);
    if (job.status === "completed" || job.status === "deadLetter") return job;

    // Once BC has accepted the order, retries only target the downstream WMS
    // release. This is the crucial boundary that prevents an outage at the
    // warehouse from producing a second BC Sales Order.
    if (job.status === "bcSynced") return this.processWms(job);

    const processing = this.update(job, { status: "processing", attemptCount: job.attemptCount + 1 });
    try {
      const companyName = resolveCompany(processing.order.brand, this.brandCompanyMap);
      const result = await this.dependencies.createSalesOrder(companyName, toBcSalesOrder(processing.order));
      const bcSynced = this.update(processing, { status: "bcSynced", companyName, bcOrderId: result?.id ?? result?.number });
      return this.processWms(bcSynced);
    } catch (error) {
      return this.handleBcFailure(processing, error);
    }
  }

  async reprocess(key: string): Promise<IntegrationJob> {
    const job = this.store.get(key);
    if (!job) throw new Error(`No integration job found for ${key}`);
    if (job.status !== "deadLetter") throw new Error("Only a dead-letter job can be reprocessed");
    const changes: Partial<IntegrationJob> = job.bcOrderId
      ? { status: "bcSynced", wmsStatus: "pending", wmsAttemptCount: 0, nextRetryAt: undefined, lastError: undefined }
      : { status: "received", attemptCount: 0, nextRetryAt: undefined, lastError: undefined };
    this.update(job, changes);
    return this.process(key);
  }

  async processDue(now = new Date()): Promise<IntegrationJob[]> {
    const due = this.store.list().filter(
      (job) =>
        (job.status === "retryScheduled" || (job.status === "bcSynced" && job.wmsStatus === "retryScheduled")) &&
        job.nextRetryAt &&
        new Date(job.nextRetryAt) <= now
    );
    return Promise.all(due.map((job) => this.process(job.idempotencyKey)));
  }

  private async processWms(job: IntegrationJob): Promise<IntegrationJob> {
    if (!this.dependencies.releaseToWms || !job.companyName) {
      return this.update(job, { status: "completed", wmsStatus: "notConfigured" });
    }

    try {
      const shipment = await this.dependencies.releaseToWms(job.companyName, job.order);
      return this.update(job, { status: "completed", wmsStatus: "sent", wmsShipment: shipment });
    } catch (error) {
      // The BC order is retained; only warehouse work needs attention.
      const category = classifyError(error);
      const attempts = (job.wmsAttemptCount ?? 0) + 1;
      const message = errorMessage(error);
      if (category === "Transient" && attempts < config.maxRetryAttempts) {
        return this.update(job, {
          status: "bcSynced", wmsStatus: "retryScheduled", wmsAttemptCount: attempts,
          nextRetryAt: retryAt(attempts, config.retryBaseDelayMs), lastError: `[WMS] ${message}`, errorCategory: category,
        });
      }
      return this.deadLetter(job, `[WMS] ${message}`, category, attempts);
    }
  }

  private async handleBcFailure(job: IntegrationJob, error: unknown): Promise<IntegrationJob> {
    const category = classifyError(error);
    const message = errorMessage(error);
    if (category === "Transient" && job.attemptCount < config.maxRetryAttempts) {
      return this.update(job, { status: "retryScheduled", nextRetryAt: retryAt(job.attemptCount, config.retryBaseDelayMs), lastError: message, errorCategory: category });
    }
    return this.deadLetter(job, message, category, job.attemptCount);
  }

  private async deadLetter(job: IntegrationJob, message: string, category: "Validation" | "Transient" | "Permanent", attempts: number) {
    const deadLetter = this.update(job, { status: "deadLetter", lastError: message, errorCategory: category, nextRetryAt: undefined, attemptCount: job.status === "bcSynced" ? job.attemptCount : attempts, wmsStatus: job.status === "bcSynced" ? "deadLetter" : job.wmsStatus, wmsAttemptCount: job.status === "bcSynced" ? attempts : job.wmsAttemptCount });
    await this.dependencies.logSyncException(deadLetter.companyName ?? config.exceptionLogCompany, {
      brandCode: deadLetter.order.brand,
      sourceSystem: `webshop-${deadLetter.order.webshopCountry}`,
      orderReference: deadLetter.order.orderReference,
      errorMessage: `[${category}] ${message}`,
      integrationKey: deadLetter.idempotencyKey,
      errorCategory: category,
      retryCount: deadLetter.status === "bcSynced" ? deadLetter.wmsAttemptCount ?? 0 : deadLetter.attemptCount,
      processingStatus: "DeadLetter",
      occurredAt: new Date().toISOString(), resolved: false,
    }).catch(() => undefined);
    return deadLetter;
  }

  private update(job: IntegrationJob, changes: Partial<IntegrationJob>): IntegrationJob {
    const updated = { ...job, ...changes, updatedAt: new Date().toISOString() };
    this.store.save(updated);
    return updated;
  }
}
