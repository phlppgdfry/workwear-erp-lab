"use client";

import { useEffect, useRef, useState } from "react";
import type { SyncException } from "@/lib/data";

export function ExceptionTable({ initial, live = false, publicDemo = false }: { initial: SyncException[]; live?: boolean; publicDemo?: boolean }) {
  const [exceptions, setExceptions] = useState(initial);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [brand, setBrand] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = exceptions.find(e => e.id === selectedId);
  useEffect(() => {
    const element = dialog.current;
    if (selectedId && element && !element.open) element.showModal();
    return () => { if (element?.open) element.close(); };
  }, [selectedId]);
  const brands = [...new Set(exceptions.map(e => e.brandCode))].sort();
  const rows = exceptions.filter(e => (!brand || e.brandCode === brand)
    && (status === "all" || e.resolved === (status === "resolved"))
    && [e.brandCode, e.orderReference, e.errorMessage, e.sourceSystem].some(v => v.toLowerCase().includes(search.toLowerCase())));

  async function resolve(id: string) {
    setPendingIds(previous => [...previous, id]); setError(""); setNotice("");
    try {
      if (publicDemo) {
        setExceptions(prev => prev.map(e => e.id === id ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e));
        setNotice("Sample exception resolved in this browser session. No order was sent or reprocessed.");
        return;
      }
      const res = await fetch(`/api/exceptions/${encodeURIComponent(id)}/resolve`, { method: "POST" });
      if (!res.ok) throw new Error("The exception could not be updated. Check the connection and try again.");
      const updated: SyncException = await res.json();
      setExceptions(prev => prev.map(e => e.id === id ? updated : e));
      setNotice(`${updated.orderReference} marked resolved. This action does not reprocess the order.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connection failed. Try again.");
    } finally { setPendingIds(previous => previous.filter(value => value !== id)); }
  }

  function exportRows() {
    const fields: (keyof SyncException)[] = ["id", "brandCode", "sourceSystem", "orderReference", "errorMessage", "occurredAt", "resolved", "resolvedAt"];
    const csv = [fields, ...rows.map(e => fields.map(k => e[k]))].map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "workwear-exceptions.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const guidance = !selected ? "" : /brand|mapping/i.test(selected.errorMessage)
    ? "Check the webshop brand code and its Business Central company mapping. Correct the routing configuration before requesting an approved retry."
    : /quantity|qty/i.test(selected.errorMessage)
    ? "Inspect the rejected order line and correct its quantity in the source webshop. Validate the corrected payload before an approved retry."
    : /blocked|item/i.test(selected.errorMessage)
    ? "Ask the catalogue owner to check the item status in Business Central. Confirm that the item can be sold before requesting an approved retry."
    : "Inspect the source payload and integration runbook. Confirm the cause with the system owner before correcting data or retrying.";
  return <>
    {publicDemo && <p className="demo-note">Interactive portfolio demo with synthetic sample exceptions. Changes stay in this page and reset on reload. <button className="text-button" onClick={() => { setExceptions(initial); setNotes({}); setNotice("Demo reset to the original sample exceptions."); }}>Reset demo</button></p>}
    <section className="metrics" aria-label="Exception summary">
      <div><span>Needs attention</span><strong>{exceptions.filter(e => !e.resolved).length}</strong><small>Open integration exceptions</small></div>
      <div><span>Resolved</span><strong>{exceptions.filter(e => e.resolved).length}</strong><small>Closed by the support team</small></div>
      <div><span>Brands in view</span><strong>{brands.length}</strong><small>Across country webshops</small></div>
      <div><span>Data connection</span><strong className="mode-value">{live ? "Live BC" : "Demo"}</strong><small>{live ? "Business Central API" : "Synthetic sample exceptions"}</small></div>
    </section>
    <section className="queue">
      <div className="section-heading"><div><h2>Integration exception queue</h2><p>Investigate the cause, correct the data, then close the exception.</p></div><button onClick={exportRows}>Export selection</button></div>
      <div className="controls">
        <label className="search-label">Search orders<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Order, source or error message" /></label>
        <label>Brand<select aria-label="Brand" value={brand} onChange={e => setBrand(e.target.value)}><option value="">All brands</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label>
        <label>Status<select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label>
        <span className="result-count" role="status">{rows.length} of {exceptions.length} exceptions</span>
      </div>
      {error && <p className="error-notice" role="alert">{error}</p>}<p className="notice" role="status">{notice}</p>
      <div className="table-scroll"><table><thead><tr><th scope="col">Status</th><th scope="col">Brand / source</th><th scope="col">Order reference</th><th scope="col">Diagnosis</th><th scope="col">Occurred (UTC)</th><th scope="col">Action</th></tr></thead>
      <tbody>{rows.map(e => <tr key={e.id}>
        <td><span className={`badge ${e.resolved ? "resolved" : "open"}`}>{e.resolved ? "Resolved" : "Open"}</span></td>
        <td><strong>{e.brandCode}</strong><small>{e.sourceSystem}</small></td><td className="order-ref"><button className="record-link" onClick={() => { setSelectedId(e.id); setDraft(""); }} aria-label={`View ${e.orderReference}`}>{e.orderReference}</button></td><td className="error-msg">{e.errorMessage}</td>
        <td className="occurred">{new Date(e.occurredAt).toISOString().slice(0,16).replace("T", " ")}</td>
        <td>{!e.resolved ? <button className="resolve" disabled={pendingIds.includes(e.id)} onClick={() => resolve(e.id)} aria-label={`Mark ${e.orderReference} resolved`}>{pendingIds.includes(e.id) ? "Saving…" : "Mark resolved"}</button> : <span className="closed-label">Closed</span>}</td>
      </tr>)}{!rows.length && <tr><td colSpan={6} className="empty">No exceptions match. Clear the search or choose another status.</td></tr>}</tbody></table></div>
      <p className="queue-note">Marking resolved closes the support record. Order reprocessing uses the separate approval and retry flow.</p>
    </section>
    <dialog ref={dialog} className="case-dialog" aria-labelledby="case-title" onCancel={() => setSelectedId(null)} onClose={() => setSelectedId(null)}>
      {selected && <><div className="case-heading"><div><span className={`badge ${selected.resolved ? "resolved" : "open"}`}>{selected.resolved ? "Resolved" : "Needs attention"}</span><h2 id="case-title">{selected.orderReference}</h2><p>{selected.brandCode} · {selected.sourceSystem}</p></div><button aria-label="Close exception details" onClick={() => setSelectedId(null)}>Close</button></div>
        <h3>Reported cause</h3><p className="case-error">{selected.errorMessage}</p>
        <h3>Suggested next step</h3><p>{guidance}</p><p className="queue-note">Guidance based on the error message; confirm the root cause before acting. Closing this record does not retry an order.</p>
        <h3>Handling history</h3><ol className="case-history"><li><time>{new Date(selected.occurredAt).toISOString()}</time><span>Exception received from {selected.sourceSystem}.</span></li>{selected.resolvedAt && <li><time>{new Date(selected.resolvedAt).toISOString()}</time><span>Support record marked resolved.</span></li>}{(notes[selected.id] || []).map((note, i) => <li key={i}><span>{note}</span></li>)}</ol>
        <form onSubmit={event => { event.preventDefault(); if (draft.trim()) { setNotes(previous => ({...previous, [selected.id]: [...(previous[selected.id] || []), `${new Date().toISOString()} · ${draft.trim()}`]})); setDraft(""); } }}><label htmlFor="case-note">Session note</label><textarea id="case-note" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Record what you checked" maxLength={1000}/><p className="queue-note">Notes stay in this page only and are cleared on reload or demo reset.</p><div className="case-actions"><button type="submit" disabled={!draft.trim()}>Add session note</button>{!selected.resolved && <button type="button" disabled={pendingIds.includes(selected.id)} onClick={() => resolve(selected.id)}>{pendingIds.includes(selected.id) ? "Saving…" : "Mark resolved"}</button>}</div></form>
      </>}
    </dialog>
  </>;
}
