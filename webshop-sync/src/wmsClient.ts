import axios from "axios";
import { WebshopOrder } from "./types";

export interface WmsShipment {
  trackingNumber: string;
  shippedQuantity: number;
  totalQuantity: number;
  status: "shipped" | "partiallyShipped";
}

export async function releaseToWms(wmsUrl: string, companyName: string, order: WebshopOrder): Promise<WmsShipment> {
  const response = await axios.post(`${wmsUrl.replace(/\/$/, "")}/warehouse-orders`, {
    orderReference: order.orderReference,
    companyName,
    brand: order.brand,
    lines: order.lines.map((line) => ({ sku: line.sku, quantity: line.quantity, size: line.size, color: line.color })),
  });
  return response.data;
}
