export interface WebshopOrderLine {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
  embroideryText?: string;
}

export interface WebshopOrder {
  brand: string; // e.g. "DASSY", "PROTEQ" -> maps to a BC company
  webshopCountry: string; // e.g. "BE", "NL", "FR"
  orderReference: string;
  customerEmail: string;
  customerName: string;
  // In a real integration this would be resolved from customerEmail via a
  // customer lookup/match step. For this demo it's supplied directly so the
  // order can be posted against a known BC customer.
  customerNumber: string;
  lines: WebshopOrderLine[];
}

export interface BcSalesOrderPayload {
  customerNumber: string;
  externalDocumentNumber: string;
  salesOrderLines: Array<{
    itemNumber: string;
    lineType: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}
