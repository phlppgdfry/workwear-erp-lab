import axios from "axios";
import { InvalidOrderError, UnknownBrandError } from "./transformOrder";

export type ErrorCategory = "Validation" | "Transient" | "Permanent";

export function classifyError(error: unknown): ErrorCategory {
  if (error instanceof InvalidOrderError || error instanceof UnknownBrandError) return "Validation";
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!status || status === 408 || status === 429 || status >= 500) return "Transient";
    return "Permanent";
  }
  // Network/time-out errors from a downstream client often arrive as ordinary
  // Errors. Explicit validation failures above are still never retried.
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/(timeout|econnreset|econnrefused|network|temporar)/.test(message)) return "Transient";
  return "Permanent";
}

export function retryAt(attemptCount: number, baseDelayMs: number): string {
  const delay = baseDelayMs * Math.pow(2, Math.max(0, attemptCount - 1));
  return new Date(Date.now() + delay).toISOString();
}
