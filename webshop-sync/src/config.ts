import "dotenv/config";

function parseBrandMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const config = {
  tenantId: process.env.BC_TENANT_ID ?? "",
  clientId: process.env.BC_CLIENT_ID ?? "",
  clientSecret: process.env.BC_CLIENT_SECRET ?? "",
  environment: process.env.BC_ENVIRONMENT ?? "sandbox",
  baseUrl: process.env.BC_BASE_URL ?? "https://api.businesscentral.dynamics.com/v2.0",
  brandCompanyMap: parseBrandMap(process.env.BRAND_COMPANY_MAP),
  // Company to log exceptions in when the brand itself can't be resolved to
  // a company (so there's nowhere brand-specific to record the failure).
  // Falls back to the first mapped company so the demo works out of the box.
  exceptionLogCompany:
    process.env.BC_EXCEPTION_LOG_COMPANY ?? Object.values(parseBrandMap(process.env.BRAND_COMPANY_MAP))[0] ?? "",
  mockMode: (process.env.MOCK_MODE ?? "true").toLowerCase() !== "false",
  integrationStatePath: process.env.INTEGRATION_STATE_PATH ?? ".data/integration-jobs.json",
  maxRetryAttempts: Number(process.env.MAX_RETRY_ATTEMPTS ?? 3),
  retryBaseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS ?? 1000),
  wmsUrl: process.env.WMS_URL ?? "",
  port: Number(process.env.PORT ?? 4000),
};
