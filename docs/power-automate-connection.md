# Connecting Power Automate without a website

Power Automate does not need a frontend. It calls an HTTPS API endpoint. The
only service it needs is `webshop-sync`, specifically the reprocess endpoint:

```text
POST https://{public-api}/operations/{integrationKey}/reprocess
```

It cannot call `http://localhost:4000`, because that address exists only on the
developer's Mac while Power Automate runs in Microsoft's cloud.

## Option A — live demonstration with ngrok

Use this for a portfolio walkthrough. It requires no website or Azure resource:

```bash
# One-time: sign in to ngrok and copy its authtoken from its dashboard.
ngrok config add-authtoken <your-ngrok-authtoken>

# Terminal 1: run the local API with a real BC configuration if desired.
cd webshop-sync
# Add INTEGRATION_API_KEY=<a long random secret> to .env first.
npm run dev

# Terminal 2: create a temporary HTTPS tunnel.
ngrok http 4000
```

Copy the `https://…ngrok-free.app` forwarding URL to the Power Automate
environment variable `WORKWEAR_INTEGRATION_BASE_URL`. Keep both terminals open
while demonstrating the flow. Do not put a Business Central client secret in a
flow; it stays in the API's local environment configuration.
Generate the API key locally with `openssl rand -hex 32`. In the Power Automate
HTTP action add header `x-api-key` with that value, mark the action's inputs and
outputs as secure, and do not place the key in this repository.

## Option B — persistent API with Azure Container Apps

`webshop-sync/Dockerfile` packages only the API; it does not create a website.
Container Apps provides a stable HTTPS address and can hold secrets. Before a
production deployment, replace the file-backed integration job store with a
managed store (Azure SQL/Table/Cosmos) with a unique index on the idempotency
key. A container's local disk is not durable enough for production replay
protection.

The current Azure subscription is in a different Entra tenant from the Power
Automate environment URL. That does not prevent the public HTTP call, but the
Business Central app registration and Power Automate connection must be created
in the tenant that owns the BC sandbox/environment.

## Power Automate configuration sequence

1. Publish the AL extension to the intended BC sandbox and verify its custom
   `syncExceptions` endpoint with a non-production record.
2. Choose Option A or B and set `WORKWEAR_INTEGRATION_BASE_URL` to the public
   HTTPS API address.
3. Create the `Workwear Operational Integration` solution in the provided
   Power Automate environment.
4. Create Business Central and Approvals connection references; use a dedicated
   integration/key-user account, not a personal developer secret.
5. Implement the approval flow described in
   `power-platform/solution/flow-definition.md`.
6. Send a deliberate dead letter, approve **Retry**, and verify one reprocess
   request plus an audit entry. Test **Manual correction** and **Reject** too.

For Option A, remove/stop the tunnel after the demo. For Option B, restrict the
API with authentication and an allowlist/API Management before connecting it to
an operational flow.

## Standard-license fallback (no Premium)

The generic **HTTP** action used to call a custom API is a Power Automate
Premium connector. Without a Premium license, keep the approval flow with its
three outcomes, but remove the HTTP action. After the key user selects
**Retry**, the operator executes the approved reprocess locally:

```bash
cd webshop-sync
npm run reprocess -- <integrationKey>
```

This retains approval evidence and separation of duties while avoiding a cloud
secret or Premium connector. It is deliberately a manual operational hand-off;
the HTTP branch becomes the upgrade path when Premium is available.
