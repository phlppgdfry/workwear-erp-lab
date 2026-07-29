export interface SyncException {
  id: string;
  brandCode: string;
  sourceSystem: string;
  orderReference: string;
  errorMessage: string;
  occurredAt: string;
  resolved: boolean;
  resolvedAt: string | null;
}

// Mirrors the shape of the "Brand Sync Exceptions API" page from the AL
// extension (api/portfoliolab/workwear/v1.0/syncExceptions). When
// BC_API_BASE_URL is set, this module would call that endpoint instead; for
// the portfolio demo it's an in-memory store seeded from the same failure
// scenarios webshop-sync produces against the sample orders.
let exceptions: SyncException[] = [
  {
    id: "1",
    brandCode: "SHOETEQ",
    sourceSystem: "webshop-NL",
    orderReference: "WEB-NL-200011",
    errorMessage: '[validation] No Business Central company mapped for brand "SHOETEQ"',
    occurredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    resolved: false,
    resolvedAt: null,
  },
  {
    id: "2",
    brandCode: "PROTEQ",
    sourceSystem: "webshop-FR",
    orderReference: "WEB-FR-300099",
    errorMessage: '[validation] Line "PPE-GLOVE-CUT5" has invalid quantity',
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    resolved: false,
    resolvedAt: null,
  },
  {
    id: "3",
    brandCode: "DASSY",
    sourceSystem: "webshop-BE",
    orderReference: "WEB-BE-099871",
    errorMessage: "[bc-api] Item DSY-JKT-NAVY blocked for sale in company CRONUS DASSY",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    resolved: true,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

export function listExceptions(): SyncException[] {
  return [...exceptions].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

export function resolveException(id: string): SyncException | null {
  const target = exceptions.find((e) => e.id === id);
  if (!target) return null;
  target.resolved = true;
  target.resolvedAt = new Date().toISOString();
  return target;
}
