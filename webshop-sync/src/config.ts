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
  mockMode: (process.env.MOCK_MODE ?? "true").toLowerCase() !== "false",
  port: Number(process.env.PORT ?? 4000),
};
