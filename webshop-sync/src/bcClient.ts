import axios from "axios";
import { config } from "./config";

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

function companyBaseUrl(companyName: string): string {
  return `${config.baseUrl}/${config.tenantId}/${config.environment}/api/v2.0/companies('${encodeURIComponent(
    companyName
  )}')`;
}

export async function createSalesOrder(companyName: string, payload: unknown) {
  if (config.mockMode) {
    return { mocked: true, companyName, payload };
  }

  const token = await getAccessToken();
  const response = await axios.post(`${companyBaseUrl(companyName)}/salesOrders`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function logSyncException(companyName: string, exception: unknown) {
  if (config.mockMode) {
    return { mocked: true, companyName, exception };
  }

  const token = await getAccessToken();
  // Calls the custom "Brand Sync Exceptions API" page published from the AL
  // extension (APIPublisher "portfoliolab", APIGroup "workwear", v1.0).
  const url = `${config.baseUrl}/${config.tenantId}/${config.environment}/api/portfoliolab/workwear/v1.0/companies('${encodeURIComponent(
    companyName
  )}')/syncExceptions`;
  const response = await axios.post(url, exception, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
