import express from "express";

interface WarehouseLine { sku: string; quantity: number; size?: string; color?: string }
interface WarehouseOrder { orderReference: string; companyName: string; brand: string; lines: WarehouseLine[] }

const app = express();
app.use(express.json());

const knownSkus = new Set(["1896-S", "PPE-GLOVE-CUT5", "DSY-JKT-NAVY"]);
const shipments = new Map<string, object>();

app.get("/health", (_req, res) => res.json({ status: "ok", component: "wms-mock" }));

app.post("/warehouse-orders", (req, res) => {
  const order = req.body as WarehouseOrder;
  if (!order.orderReference || !order.companyName || !order.lines?.length) {
    return res.status(422).json({ error: "orderReference, companyName and at least one line are required" });
  }
  const unknown = order.lines.find((line) => !knownSkus.has(line.sku));
  if (unknown) return res.status(422).json({ error: `Unknown warehouse variant/SKU: ${unknown.sku}` });

  const existing = shipments.get(order.orderReference);
  if (existing) return res.status(200).json(existing); // Warehouse-side idempotency.

  const totalQuantity = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  // A specific SKU models an inventory shortage, so the demo can show partial
  // delivery rather than only a happy path.
  const shippedQuantity = order.lines.some((line) => line.sku === "PPE-GLOVE-CUT5") ? Math.max(0, totalQuantity - 1) : totalQuantity;
  const shipment = {
    orderReference: order.orderReference,
    status: shippedQuantity === totalQuantity ? "shipped" : "partiallyShipped",
    shippedQuantity,
    totalQuantity,
    trackingNumber: `WW-${order.orderReference.replace(/[^A-Z0-9]/gi, "").slice(-10).toUpperCase()}`,
  };
  shipments.set(order.orderReference, shipment);
  return res.status(201).json(shipment);
});

app.get("/shipments/:orderReference", (req, res) => {
  const shipment = shipments.get(req.params.orderReference);
  return shipment ? res.json(shipment) : res.status(404).json({ error: "Shipment not found" });
});

const port = Number(process.env.PORT ?? 4100);
app.listen(port, () => console.log(`wms-mock listening on :${port}`));
