import { listExceptions, isLive } from "@/lib/exceptions";
import { ExceptionTable } from "./ExceptionTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  const exceptions = await listExceptions();
  const openCount = exceptions.filter((e) => !e.resolved).length;

  return (
    <main>
      <h1>Brand Sync Exceptions</h1>
      <p className="subtitle">
        {openCount} open of {exceptions.length} total — webshop → Business Central order sync failures across all
        brands. {isLive() ? "Live from Business Central." : "Showing mock data (set BC_ credentials for live mode)."}
      </p>
      <ExceptionTable initial={exceptions} />
    </main>
  );
}
