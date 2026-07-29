import { BcSalesOrderPayload, WebshopOrder } from "./types";

export class UnknownBrandError extends Error {}
export class InvalidOrderError extends Error {}

export function resolveCompany(brand: string, brandCompanyMap: Record<string, string>): string {
  const company = brandCompanyMap[brand.toUpperCase()];
  if (!company) {
    throw new UnknownBrandError(`No Business Central company mapped for brand "${brand}"`);
  }
  return company;
}

export function validateOrder(order: WebshopOrder): void {
  if (!order.orderReference) throw new InvalidOrderError("Missing orderReference");
  if (!order.brand) throw new InvalidOrderError("Missing brand");
  if (!order.lines || order.lines.length === 0) throw new InvalidOrderError("Order has no lines");
  for (const line of order.lines) {
    if (line.quantity <= 0) throw new InvalidOrderError(`Line "${line.sku}" has invalid quantity`);
  }
}

// Personalization pricing mirrors the AL "Variant Pricing Mgt" codeunit so the
// order lands in BC pre-priced consistently with manual order entry: a flat
// setup fee plus a per-character fee for embroidery/logo text.
const EMBROIDERY_FLAT_FEE = 4.5;
const EMBROIDERY_PER_CHAR_FEE = 0.35;

function withEmbroiderySurcharge(unitPrice: number, embroideryText?: string): number {
  if (!embroideryText) return unitPrice;
  return unitPrice + EMBROIDERY_FLAT_FEE + embroideryText.length * EMBROIDERY_PER_CHAR_FEE;
}

export function toBcSalesOrder(order: WebshopOrder): BcSalesOrderPayload {
  validateOrder(order);

  return {
    externalDocumentNumber: order.orderReference,
    salesOrderLines: order.lines.map((line) => ({
      itemId: line.sku,
      lineType: "Item",
      description: [line.description, line.size, line.color].filter(Boolean).join(" / "),
      quantity: line.quantity,
      unitPrice: withEmbroiderySurcharge(line.unitPrice, line.embroideryText),
    })),
  };
}
