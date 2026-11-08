# Workwear support desk portfolio walkthrough

1. Inspect the multi-brand integration flow and the support summary.
2. Filter by brand, open/resolved state or order reference.
3. Mark an example exception resolved and watch the summary update.
4. Export the filtered queue, then reset the public demo to its initial state.
5. Follow the solution-design and runbook links for the end-to-end integration.

## Run the public demo locally

```sh
cd exception-dashboard
npm ci
npm run dev:demo
```

Open the URL printed by Vite. `npm run build:demo` creates `demo-dist/` for Pages.
The public bundle renders the same `SupportDesk` and `ExceptionTable` components
as the Next.js app, using sample records and local React state. It never imports
the BC connector, sends orders, or persists changes outside the page.

## Run the Next.js app

```sh
cd exception-dashboard
npm ci
npm run dev
```

Without BC credentials it uses the existing in-memory mock API. With configured
credentials it reads the configured BC company and resolves through its API.
Production access control, durable state and environment secrets remain separate
deployment work; the live app is not deployed publicly as part of this portfolio.

Closing an exception does not retry an order. Approval and retry semantics stay
with webshop-sync and the Power Platform blueprint; see the root DEMO.md.
