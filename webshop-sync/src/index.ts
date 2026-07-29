import express from "express";
import { config } from "./config";
import { createSalesOrder, logSyncException } from "./bcClient";
import { InvalidOrderError, resolveCompany, toBcSalesOrder, UnknownBrandError } from "./transformOrder";
import { WebshopOrder } from "./types";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mockMode: config.mockMode });
});

app.post("/webshop-order", async (req, res) => {
  const order = req.body as WebshopOrder;
  let companyName: string | undefined;

  try {
    companyName = resolveCompany(order.brand, config.brandCompanyMap);
    const bcPayload = toBcSalesOrder(order);
    const result = await createSalesOrder(companyName, bcPayload);

    res.status(201).json({ status: "synced", company: companyName, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const exceptionType = err instanceof UnknownBrandError || err instanceof InvalidOrderError ? "validation" : "bc-api";

    console.error(`[webshop-sync] order ${order?.orderReference ?? "unknown"} failed: ${message}`);

    await logSyncException(companyName ?? "UNMAPPED", {
      brandCode: order?.brand ?? "UNKNOWN",
      sourceSystem: `webshop-${order?.webshopCountry ?? "?"}`,
      orderReference: order?.orderReference ?? "UNKNOWN",
      errorMessage: `[${exceptionType}] ${message}`,
      occurredAt: new Date().toISOString(),
      resolved: false,
    }).catch((logErr) => {
      console.error("[webshop-sync] also failed to log exception to BC:", logErr);
    });

    res.status(422).json({ status: "failed", reason: message });
  }
});

app.listen(config.port, () => {
  console.log(`webshop-sync listening on :${config.port} (mockMode=${config.mockMode})`);
});
