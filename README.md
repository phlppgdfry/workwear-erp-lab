# Workwear ERP Lab

A self-built portfolio project simulating a multi-brand workwear ERP landscape on
**Microsoft Dynamics 365 Business Central**, built to prepare for an ERP Business
Analyst role centered on Business Central, webshop/PLM/PIM/WMS integrations, and
multi-entity operations after brand acquisitions.

This is **not** built against any real company's system or data — it's a simulated
scenario (a workwear manufacturer/distributor operating multiple brands and
country webshops) designed to demonstrate the same skills the role asks for:

- Fit-gap thinking translated into BC extensions (AL)
- Webshop → ERP order integration
- Multi-brand/multi-entity consolidation after an acquisition
- Product variant configuration (size/color/customization) typical of workwear
- Second-line "run" concerns: interface exceptions, periodic checks, documentation

## Structure

```
al-extension/         Business Central AL extension (build-side customizations)
webshop-sync/         Node/TypeScript service: webshop order -> BC Sales Order via API
exception-dashboard/  Next.js viewer for integration exceptions (run-side monitoring)
docs/                 Fit-gap notes, solution design write-up
```

## Scenario

A workwear group runs several brands (private-label workwear, PPE, custom-made
garments, safety footwear) as separate BC companies within one tenant, after
acquiring two smaller brands. Each brand has its own country webshops. The goals:

1. Push webshop orders into the right BC company as Sales Orders, with size/color
   variants and customization (embroidery/logo) surcharges applied automatically.
2. Give management a consolidated cross-brand sales view without merging the
   underlying BC companies.
3. Give the IT/support team visibility into failed or exceptional syncs, instead
   of finding out from an angry customer.

## Requirements to run for real

- A Business Central sandbox environment (free trial or Docker sandbox)
- An Azure AD app registration with `API.ReadWrite.All` delegated/application
  permissions on the BC API, for `webshop-sync` to authenticate
- AL Language extension for VS Code, pointed at the sandbox, to deploy `al-extension`

Without those credentials the AL project still compiles/reads as valid AL, and
`webshop-sync`/`exception-dashboard` run against a local mock instead of live BC
(see each folder's README).

## Why this shape

Three separate throwaway exercises would each need their own BC connection and
wouldn't show how the pieces fit together. One coherent scenario mirrors what the
role actually asks for: translating business needs into a working solution across
build (AL, integrations) and run (monitoring, documentation).

## Demo

See [DEMO.md](DEMO.md) for a walkthrough script covering all four pieces.

## Verified against a live sandbox

Every piece here has run against a real Business Central sandbox, not just
compiled: webshop-sync created an actual Sales Order via the API, item and
company lookups resolve to real BC GUIDs, and exception-dashboard reads and
resolves real records through the custom API page. Along the way this surfaced
and fixed several real BC integration issues — a FlowField that needed
`CalcFields`, OData company-name encoding, permission scoping for a custom
Entra app registration, and resolving item numbers to GUIDs — documented in
the git history.

## Known limitations

Deliberate scope cuts for a portfolio project, not oversights:

- **No retry/idempotency in webshop-sync** — a duplicate webhook delivery
  would create a duplicate Sales Order. A real integration would dedupe on
  `externalDocumentNumber` before posting.
- **`Workwear Ext - Full` permission set is broad** (RIMD on all extension
  tables) rather than scoped per read/write need — fine for a single-tenant
  demo, not how you'd scope a production integration user.
- **Secrets live in `.env`/`.env.local`** — acceptable for local development,
  not for production (would move to Key Vault / managed identity).
- **exception-dashboard's live mode targets a single company** via
  `BC_COMPANY_NAME` rather than aggregating across all mapped brands like the
  AL consolidation report does.
