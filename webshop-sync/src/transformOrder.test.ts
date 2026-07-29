import { InvalidOrderError, resolveCompany, toBcSalesOrder, UnknownBrandError, validateOrder } from "./transformOrder";
import { WebshopOrder } from "./types";

function baseOrder(overrides: Partial<WebshopOrder> = {}): WebshopOrder {
  return {
    brand: "DASSY",
    webshopCountry: "BE",
    orderReference: "WEB-BE-1",
    customerEmail: "buyer@example.com",
    customerName: "Test Customer",
    customerNumber: "10000",
    lines: [{ sku: "1896-S", description: "Jacket", quantity: 1, unitPrice: 10 }],
    ...overrides,
  };
}

describe("resolveCompany", () => {
  const map = { DASSY: "CRONUS DASSY" };

  it("resolves a mapped brand case-insensitively", () => {
    expect(resolveCompany("dassy", map)).toBe("CRONUS DASSY");
  });

  it("throws UnknownBrandError for an unmapped brand", () => {
    expect(() => resolveCompany("SHOETEQ", map)).toThrow(UnknownBrandError);
  });
});

describe("validateOrder", () => {
  it("accepts a well-formed order", () => {
    expect(() => validateOrder(baseOrder())).not.toThrow();
  });

  it("rejects a missing orderReference", () => {
    expect(() => validateOrder(baseOrder({ orderReference: "" }))).toThrow(InvalidOrderError);
  });

  it("rejects a missing customerNumber", () => {
    expect(() => validateOrder(baseOrder({ customerNumber: "" }))).toThrow(InvalidOrderError);
  });

  it("rejects an order with no lines", () => {
    expect(() => validateOrder(baseOrder({ lines: [] }))).toThrow(InvalidOrderError);
  });

  it("rejects a line with zero or negative quantity", () => {
    expect(() =>
      validateOrder(baseOrder({ lines: [{ sku: "X", description: "X", quantity: 0, unitPrice: 1 }] }))
    ).toThrow(InvalidOrderError);
  });
});

describe("toBcSalesOrder", () => {
  it("maps a plain line without embroidery unchanged", () => {
    const result = toBcSalesOrder(baseOrder());
    expect(result.salesOrderLines[0].unitPrice).toBe(10);
    expect(result.salesOrderLines[0].itemNumber).toBe("1896-S");
  });

  it("applies the flat fee plus per-character fee when embroidery text is set", () => {
    const order = baseOrder({
      lines: [{ sku: "1896-S", description: "Jacket", quantity: 1, unitPrice: 10, embroideryText: "TEST" }],
    });
    const result = toBcSalesOrder(order);
    // 10 + 4.5 flat + 4 chars * 0.35 = 15.9
    expect(result.salesOrderLines[0].unitPrice).toBeCloseTo(15.9);
  });

  it("joins description, size and color, skipping missing parts", () => {
    const order = baseOrder({
      lines: [{ sku: "1896-S", description: "Jacket", quantity: 1, unitPrice: 10, size: "L", color: "Navy" }],
    });
    const result = toBcSalesOrder(order);
    expect(result.salesOrderLines[0].description).toBe("Jacket / L / Navy");
  });

  it("carries the customer number and external document number through", () => {
    const result = toBcSalesOrder(baseOrder({ orderReference: "WEB-BE-999", customerNumber: "20000" }));
    expect(result.customerNumber).toBe("20000");
    expect(result.externalDocumentNumber).toBe("WEB-BE-999");
  });
});
