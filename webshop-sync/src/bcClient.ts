import axios from "axios";
import { config } from "./config";
import { BcSalesOrderPayload } from "./types";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://api.businesscentral.dynamics.com/.default",
  });

  const response = await axios.post(tokenUrl, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  cachedToken = {
    value: response.data.access_token,
    expiresAt: Date.now() + (response.data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

const companyIdCache = new Map<string, string>();

// BC's OData "companies('Name With Spaces')" path segment is unreliable to
// URL-encode correctly across environments; resolving to the immutable
// company id first and addressing companies(<guid>) is the documented
// robust pattern.
async function getCompanyId(companyName: string): Promise<string> {
  const cached = companyIdCache.get(companyName);
  if (cached) return cached;

  const token = await getAccessToken();
  const url = `${config.baseUrl}/${config.tenantId}/${config.environment}/api/v2.0/companies?$filter=${encodeURIComponent(
    `name eq '${companyName}'`
  )}`;
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  const company = response.data.value?.[0];
  if (!company) {
    throw new Error(`No Business Central company found with name "${companyName}"`);
  }

  companyIdCache.set(companyName, company.id);
  return company.id;
}

async function companyBaseUrl(companyName: string, apiSegment: string): Promise<string> {
  const companyId = await getCompanyId(companyName);
  return `${config.baseUrl}/${config.tenantId}/${config.environment}/api/${apiSegment}/companies(${companyId})`;
}

const itemIdCache = new Map<string, string>();

// The standard salesOrders API expects each line's item as an "itemId" (the
// item's internal GUID), not its number/SKU. Webshop orders only know the
// SKU, so resolve it per company before posting.
async function getItemId(companyName: string, itemNumber: string): Promise<string> {
  const cacheKey = `${companyName}::${itemNumber}`;
  const cached = itemIdCache.get(cacheKey);
  if (cached) return cached;

  const token = await getAccessToken();
  const base = await companyBaseUrl(companyName, "v2.0");
  const url = `${base}/items?$filter=${encodeURIComponent(`number eq '${itemNumber}'`)}`;
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  const item = response.data.value?.[0];
  if (!item) {
    throw new Error(`No item found with number "${itemNumber}" in company "${companyName}"`);
  }

  itemIdCache.set(cacheKey, item.id);
  return item.id;
}

export async function createSalesOrder(companyName: string, payload: BcSalesOrderPayload) {
  if (config.mockMode) {
    return { mocked: true, companyName, payload };
  }

  const token = await getAccessToken();
  const base = await companyBaseUrl(companyName, "v2.0");

  const resolvedLines = await Promise.all(
    payload.salesOrderLines.map(async ({ itemNumber, ...line }) => ({
      ...line,
      itemId: await getItemId(companyName, itemNumber),
    }))
  );

  const response = await axios.post(
    `${base}/salesOrders`,
    { ...payload, salesOrderLines: resolvedLines },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function logSyncException(companyName: string, exception: unknown) {
  if (config.mockMode) {
    return { mocked: true, companyName, exception };
  }

  const token = await getAccessToken();
  // Calls the custom "Brand Sync Exceptions API" page published from the AL
  // extension (APIPublisher "portfoliolab", APIGroup "workwear", v1.0).
  const base = await companyBaseUrl(companyName, "portfoliolab/workwear/v1.0");
  const response = await axios.post(`${base}/syncExceptions`, exception, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
