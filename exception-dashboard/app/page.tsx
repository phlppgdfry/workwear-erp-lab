import { listExceptions, isLive } from "@/lib/exceptions";
import { SupportDesk } from "./SupportDesk";
export const dynamic = "force-dynamic";

export default async function Page() {
  const exceptions = await listExceptions();
  return <SupportDesk exceptions={exceptions} live={isLive()} />;
}
