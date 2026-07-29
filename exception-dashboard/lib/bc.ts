import type { SyncException } from "./data";

const bcConfig = {
  tenantId: process.env.BC_TENANT_ID ?? "",
  clientId: process.env.BC_CLIENT_ID ?? "",
  clientSecret: process.env.BC_CLIENT_SECRET ?? "",
  environment: process.env.BC_ENVIRONMENT ?? "sandbox",
  baseUrl: process.env.BC_BASE_URL ?? "https://api.businesscentral.dynamics.com/v2.0",
  companyName: process.env.BC_COMPANY_NAME ?? "",
};

export function isLiveModeConfigured(): boolean {
  return Boolean(bcConfig.tenantId && bcConfig.clientId && bcConfig.clientSecret && bcConfig.companyName);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: bcConfig.clientId,
    client_secret: bcConfig.clientSecret,
    scope: "https://api.businesscentral.dynamics.com/.default",
  });

  const response = await fetch(`https://login.microsoftonline.com/${bcConfig.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get BC access token: ${JSON.stringify(data)}`);
  }

  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

let cachedCompanyId: string | null = null;

async function getCompanyId(token: string): Promise<string> {
  if (cachedCompanyId) return cachedCompanyId;

  const url = `${bcConfig.baseUrl}/${bcConfig.tenantId}/${bcConfig.environment}/api/v2.0/companies?$filter=${encodeURIComponent(
    `name eq '${bcConfig.companyName}'`
  )}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const data = await response.json();
  const company = data.value?.[0];
  if (!company) {
    throw new Error(`No Business Central company found with name "${bcConfig.companyName}"`);
  }

  cachedCompanyId = company.id;
  return company.id;
}

function toSyncException(raw: any): SyncException {
  return {
    id: raw.systemId,
    brandCode: raw.brandCode,
    sourceSystem: raw.sourceSystem,
    orderReference: raw.orderReference,
    errorMessage: raw.errorMessage,
    occurredAt: raw.occurredAt,
    resolved: raw.resolved,
    resolvedAt: raw.resolved ? raw.resolvedAt : null,
  };
}

// Reads/writes the "Brand Sync Exceptions API" custom page published from
// the al-extension project (APIPublisher "portfoliolab", APIGroup
// "workwear", v1.0). Mirrors webshop-sync's bcClient.ts company/token
// handling so both pieces talk to BC the same way.
export async function fetchLiveExceptions(): Promise<SyncException[]> {
  const token = await getAccessToken();
  const companyId = await getCompanyId(token);
  const url = `${bcConfig.baseUrl}/${bcConfig.tenantId}/${bcConfig.environment}/api/portfoliolab/workwear/v1.0/companies(${companyId})/syncExceptions`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch exceptions from BC: ${JSON.stringify(data)}`);
  }

  return (data.value ?? [])
    .map(toSyncException)
    .sort((a: SyncException, b: SyncException) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

export async function resolveLiveException(id: string): Promise<SyncException> {
  const token = await getAccessToken();
  const companyId = await getCompanyId(token);
  const url = `${bcConfig.baseUrl}/${bcConfig.tenantId}/${bcConfig.environment}/api/portfoliolab/workwear/v1.0/companies(${companyId})/syncExceptions(${id})`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "If-Match": "*",
    },
    body: JSON.stringify({ resolved: true }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to resolve exception in BC: ${JSON.stringify(data)}`);
  }

  return toSyncException(data);
}
