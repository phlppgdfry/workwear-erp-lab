import { ExceptionTable } from "./ExceptionTable";
import type { SyncException } from "../lib/data";

export function SupportDesk({ exceptions, live = false, publicDemo = false }: { exceptions: SyncException[]; live?: boolean; publicDemo?: boolean }) {
  return <>
    <header className="app-header"><a className="brand" href="./">Workwear <span>ERP Lab</span></a><nav aria-label="Project"><a href="https://github.com/phlppgdfry/workwear-erp-lab">Source & documentation</a></nav></header>
    <main><section className="opening"><div><h1>Keep every brand<br />moving together.</h1><p>A shared support desk for webshop orders, Business Central and warehouse operations.</p></div><div className="context"><strong>{live ? "Business Central connected" : "Portfolio simulation"}</strong><span>{live ? "Company-scoped operational exceptions" : "Sample exceptions · no credentials required"}</span><span>Philippe Godfroy / ERP & integration engineering</span></div></section>
    <section className="pipeline" aria-label="Integration architecture"><span>Country webshops</span><b aria-hidden="true">›</b><span>Validate & route</span><b aria-hidden="true">›</b><span>Business Central</span><b aria-hidden="true">›</b><span>WMS & tracking</span><b aria-hidden="true">›</b><span>Support & approval</span></section>
    <ExceptionTable initial={exceptions} live={live} publicDemo={publicDemo} />
    <section className="method"><div><h2>Built for the work after go-live.</h2><p>Brand routing, idempotent orders and separate BC/WMS retries keep integration failures understandable. This dashboard reads and closes support exceptions; it is not a retry console.</p></div><div><h3>Explore the implementation</h3><a href="https://github.com/phlppgdfry/workwear-erp-lab/blob/master/docs/solution-design.md">Solution design</a><a href="https://github.com/phlppgdfry/workwear-erp-lab/blob/master/DEMO.md">End-to-end demo script</a><a href="https://github.com/phlppgdfry/workwear-erp-lab/blob/master/docs/runbook.md">Support runbook</a></div></section>
    </main><footer>Workwear ERP Lab / Independent portfolio project by Philippe Godfroy</footer>
  </>;
}
