import { createMemoryJobStore } from "./jobStore";
import { SyncService } from "./syncService";
import { WebshopOrder } from "./types";

const order: WebshopOrder = {
  brand: "DASSY", webshopCountry: "BE", orderReference: "WEB-BE-IDEMPOTENT-1",
  customerEmail: "buyer@example.com", customerName: "Test", customerNumber: "10000",
  lines: [{ sku: "1896-S", description: "Jacket", quantity: 1, unitPrice: 10 }],
};

function service(createSalesOrder = jest.fn().mockResolvedValue({ id: "bc-order-1" })) {
  return {
    createSalesOrder,
    sync: new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: jest.fn().mockResolvedValue({}),
    }),
  };
}

describe("SyncService operational safeguards", () => {
  it("returns the original result for a duplicate delivery without calling BC twice", async () => {
    const { sync, createSalesOrder } = service();
    const first = sync.receive(order);
    await sync.process(first.job.idempotencyKey);
    const second = sync.receive(order);

    expect(second.duplicate).toBe(true);
    expect(second.job.status).toBe("completed");
    expect(createSalesOrder).toHaveBeenCalledTimes(1);
  });

  it("schedules a transient BC error, then dead-letters it after the retry limit", async () => {
    const failing = jest.fn().mockRejectedValue(new Error("network timeout"));
    const { sync } = service(failing);
    const received = sync.receive(order);
    const scheduled = await sync.process(received.job.idempotencyKey);
    expect(scheduled.status).toBe("retryScheduled");
    expect(scheduled.errorCategory).toBe("Transient");

    // Drive the retry worker forward twice without waiting in a test.
    await sync.processDue(new Date("2100-01-01"));
    const final = await sync.processDue(new Date("2100-01-01"));
    expect(final[0].status).toBe("deadLetter");
  });

  it("retries a WMS release without creating the BC order again", async () => {
    const createSalesOrder = jest.fn().mockResolvedValue({ id: "bc-order-2" });
    const releaseToWms = jest
      .fn()
      .mockRejectedValueOnce(new Error("network timeout"))
      .mockResolvedValueOnce({ trackingNumber: "WW-2", shippedQuantity: 1, totalQuantity: 1, status: "shipped" as const });
    const sync = new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: jest.fn().mockResolvedValue({}),
      releaseToWms,
    });
    const received = sync.receive(order);
    const first = await sync.process(received.job.idempotencyKey);
    expect(first.status).toBe("bcSynced");
    expect(first.wmsStatus).toBe("retryScheduled");

    const retried = await sync.processDue(new Date("2100-01-01"));
    expect(retried[0].status).toBe("completed");
    expect(createSalesOrder).toHaveBeenCalledTimes(1);
    expect(releaseToWms).toHaveBeenCalledTimes(2);
  });

  it("reprocesses a WMS dead letter without recreating the accepted BC order", async () => {
    const createSalesOrder = jest.fn().mockResolvedValue({ id: "bc-order-3" });
    const releaseToWms = jest
      .fn()
      .mockRejectedValueOnce(new Error("Unknown warehouse variant"))
      .mockResolvedValueOnce({ trackingNumber: "WW-3", shippedQuantity: 1, totalQuantity: 1, status: "shipped" as const });
    const sync = new SyncService(createMemoryJobStore(), {
      createSalesOrder,
      logSyncException: jest.fn().mockResolvedValue({}),
      releaseToWms,
    });
    const received = sync.receive(order);
    const deadLetter = await sync.process(received.job.idempotencyKey);
    expect(deadLetter.status).toBe("deadLetter");

    const recovered = await sync.reprocess(received.job.idempotencyKey);
    expect(recovered.status).toBe("completed");
    expect(createSalesOrder).toHaveBeenCalledTimes(1);
  });
});
