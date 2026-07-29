"use client";

import { useState } from "react";
import type { SyncException } from "@/lib/data";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ExceptionTable({ initial }: { initial: SyncException[] }) {
  const [exceptions, setExceptions] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function resolve(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/exceptions/${id}/resolve`, { method: "POST" });
      if (res.ok) {
        const updated: SyncException = await res.json();
        setExceptions((prev) => prev.map((e) => (e.id === id ? updated : e)));
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Brand</th>
          <th>Source</th>
          <th>Order Ref</th>
          <th>Error</th>
          <th>Occurred</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {exceptions.map((e) => (
          <tr key={e.id}>
            <td>
              <span className={`badge ${e.resolved ? "resolved" : "open"}`}>{e.resolved ? "Resolved" : "Open"}</span>
            </td>
            <td>{e.brandCode}</td>
            <td>{e.sourceSystem}</td>
            <td>{e.orderReference}</td>
            <td className="error-msg">{e.errorMessage}</td>
            <td>{formatDate(e.occurredAt)}</td>
            <td>
              {!e.resolved && (
                <button className="resolve" disabled={pendingId === e.id} onClick={() => resolve(e.id)}>
                  {pendingId === e.id ? "..." : "Mark resolved"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
