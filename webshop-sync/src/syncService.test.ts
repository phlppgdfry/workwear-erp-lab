import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createMemoryJobStore } from "./jobStore";
import { SyncService } from "./syncService";
import { WebshopOrder } from "./types";

const order: WebshopOrder = {
  brand: "DASSY", webshopCountry: "BE", orderReference: "WEB-BE-IDEMPOTENT-1",
  customerEmail: "buyer@example.com", customerName: "Test", customerNumber: "10000",
  lines: [{ sku: "1896-S", description: "Jacket", quantity: 1, unitPrice: 10 }],
};
const brandCompanyMap = { DASSY: "CRONUS DASSY" };

function service(createSalesOrder = mock.fn(async () => ({ id: "bc-order-1" }))) {
  return {
    createSalesOrder,
    sync: new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: mock.fn(async () => ({})),
    }, brandCompanyMap),
  };
}

describe("SyncService operational safeguards", () => {
  it("returns the original result for a duplicate delivery without calling BC twice", async () => {
    const { sync, createSalesOrder } = service();
    const first = sync.receive(order);
    await sync.process(first.job.idempotencyKey);
    const second = sync.receive(order);

    assert.equal(second.duplicate, true);
    assert.equal(second.job.status, "completed");
    assert.equal(createSalesOrder.mock.callCount(), 1);
  });

  it("schedules a transient BC error, then dead-letters it after the retry limit", async () => {
    const failing = mock.fn(async () => { throw new Error("network timeout"); });
    const { sync } = service(failing);
    const received = sync.receive(order);
    const scheduled = await sync.process(received.job.idempotencyKey);
    assert.equal(scheduled.status, "retryScheduled");
    assert.equal(scheduled.errorCategory, "Transient");

    // Drive the retry worker forward twice without waiting in a test.
    await sync.processDue(new Date("2100-01-01"));
    const final = await sync.processDue(new Date("2100-01-01"));
    assert.equal(final[0].status, "deadLetter");
  });

  it("retries a WMS release without creating the BC order again", async () => {
    const createSalesOrder = mock.fn(async () => ({ id: "bc-order-2" }));
    const releaseToWms = mock.fn(async () => ({
      trackingNumber: "WW-2", shippedQuantity: 1, totalQuantity: 1, status: "shipped" as const,
    }));
    releaseToWms.mock.mockImplementationOnce(async () => { throw new Error("network timeout"); });
    const sync = new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: mock.fn(async () => ({})),
      releaseToWms,
    }, brandCompanyMap);
    const received = sync.receive(order);
    const first = await sync.process(received.job.idempotencyKey);
    assert.equal(first.status, "bcSynced");
    assert.equal(first.wmsStatus, "retryScheduled");

    const retried = await sync.processDue(new Date("2100-01-01"));
    assert.equal(retried[0].status, "completed");
    assert.equal(createSalesOrder.mock.callCount(), 1);
    assert.equal(releaseToWms.mock.callCount(), 2);
  });

  it("reprocesses a WMS dead letter without recreating the accepted BC order", async () => {
    const createSalesOrder = mock.fn(async () => ({ id: "bc-order-3" }));
    const releaseToWms = mock.fn(async () => ({
      trackingNumber: "WW-3", shippedQuantity: 1, totalQuantity: 1, status: "shipped" as const,
    }));
    releaseToWms.mock.mockImplementationOnce(async () => { throw new Error("Unknown warehouse variant"); });
    const sync = new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: mock.fn(async () => ({})),
      releaseToWms,
    }, brandCompanyMap);
    const received = sync.receive(order);
    const deadLetter = await sync.process(received.job.idempotencyKey);
    assert.equal(deadLetter.status, "deadLetter");

    const recovered = await sync.reprocess(received.job.idempotencyKey);
    assert.equal(recovered.status, "completed");
    assert.equal(createSalesOrder.mock.callCount(), 1);
  });
});
