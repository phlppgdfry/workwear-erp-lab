import { listExceptions } from "@/lib/data";
import { ExceptionTable } from "./ExceptionTable";

export const dynamic = "force-dynamic";

export default function Page() {
  const exceptions = listExceptions();
  const openCount = exceptions.filter((e) => !e.resolved).length;

  return (
    <main>
      <h1>Brand Sync Exceptions</h1>
      <p className="subtitle">
        {openCount} open of {exceptions.length} total — webshop → Business Central order sync failures across all
        brands.
      </p>
      <ExceptionTable initial={exceptions} />
    </main>
  );
}
