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
  lines: WebshopOrderLine[];
}

export interface BcSalesOrderPayload {
  customerNumber?: string;
  externalDocumentNumber: string;
  salesOrderLines: Array<{
    itemId?: string;
    lineType: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}
