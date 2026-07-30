# Solution design

`webshop-sync` is the orchestration boundary. It owns an idempotency key
(`brand::country::orderReference`) and an operational job state. The job moves
through `received`, `processing`, `retryScheduled`, `deadLetter`, `bcSynced`
and `completed`.

Business Central remains the system of record for the sales order. The WMS
simulator is deliberately downstream: only a confirmed BC order is released.
This split means a WMS outage retries warehouse release only, never order
creation. The custom BC exception entity gives functional users a familiar
place to review terminal failures; the dashboard and Power Automate flow are
operational interfaces around that same process.

For production, replace the local JSON store with an Azure SQL/Cosmos table
with a unique idempotency index, run due retries from a durable worker, use Key
Vault/managed identity, and give the integration principal least-privilege BC
permissions.
