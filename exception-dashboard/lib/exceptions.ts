import { isLiveModeConfigured, fetchLiveExceptions, resolveLiveException } from "./bc";
import { listMockExceptions, resolveMockException, SyncException } from "./data";

export type { SyncException } from "./data";

export async function listExceptions(): Promise<SyncException[]> {
  if (isLiveModeConfigured()) {
    return fetchLiveExceptions();
  }
  return listMockExceptions();
}

export async function resolveException(id: string): Promise<SyncException | null> {
  if (isLiveModeConfigured()) {
    return resolveLiveException(id);
  }
  return resolveMockException(id);
}

export function isLive(): boolean {
  return isLiveModeConfigured();
}
