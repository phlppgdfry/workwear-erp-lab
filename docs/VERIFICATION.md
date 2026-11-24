# Closeout audit — 24 November 2026

The first mobile record, native case dialog, suggested guidance, session notes, history, resolution, filtered CSV and reset behavior have been rechecked.

2 Chromium browser checks passed across 1440×1000 desktop and 390×844 mobile emulation. No uncaught page errors or horizontal page overflow were observed. The full five-project set contains 20 browser checks. Current npm audit: zero known vulnerabilities. Local Markdown links resolve. Browser plugin not available; validation used Playwright. Physical devices, Safari and production terminal/ERP integrations are outside this synthetic portfolio acceptance scope.

# Verification — 24 November 2026

The mobile queue begins within the first viewport. Order references open a keyboard-accessible case dialog with the reported error, suggested next step, occurrence/resolution history and session-only notes. Resolving an exception closes its support record; it does not retry an order.

Current checks: production build, functional browser flows on desktop/mobile, CSV/download contents and no uncaught browser errors. PDF source reconciliation and gate-validator checks run in their respective CI pipelines. Updated screenshots are actual renders of the production artifacts.

## Earlier release evidence

# Verification record

Portfolio refresh · 8 November 2026 · Finalized 15 November 2026

- `webshop-sync`: 15 original test scenarios pass using Node’s built-in test runner; TypeScript build passed.
- `wms-mock`: TypeScript build passed.
- `exception-dashboard`: Next.js production build, TypeScript validation and
  static demo build passed; patched Next.js and PostCSS dependencies.
- Dashboard `npm audit`: zero known vulnerabilities.
- Patched compatible Axios, Express and transitive backend dependencies. All
  three Node components report zero known **production** vulnerabilities with
  `npm audit --omit=dev`; the 15 sync tests and both backend builds still pass.
- Chromium public demo: status filter, resolve action, updated summary, reset,
  empty search and CSV export passed.
- Chromium local Next app, explicitly forced into mock mode: simulated a 503
  resolve failure and checked visible recovery guidance; retried successfully,
  then confirmed GET /api/exceptions returned the resolved record.
- Public demo desktop/mobile fit and zero uncaught JavaScript errors checked.
- No live BC writes, customer order processing or Power Platform deployment was
  performed during this refresh. Existing live-sandbox history remains separate.

## Resolved development-tool advisory

The remaining Jest/deepmerge advisory was removed on 15 November 2026 by moving
all 15 existing scenarios to Node's built-in `node:test`, `node:assert/strict`
and mock APIs. No application business logic changed. Removing Jest, ts-jest
and their types removed 256 installed packages. The latest `npm audit` reports
zero known vulnerabilities across all dependencies of webshop-sync, wms-mock
and exception-dashboard, including development dependencies.

Tests compile to ignored `.test-dist/`; production TypeScript builds exclude
`*.test.ts`. CI uses Node 22 and runs the same `npm test` command.

## Browser evidence

Desktop screenshots use a 1440 × 1040 viewport; mobile screenshots use 390 × 844.
These are actual Chromium captures of the built applications, not design mockups.
Screenshots show sample data. External map, chart-library or weather availability
can vary independently of the application.

- [Desktop capture](screenshots/desktop.png)
- [Mobile capture](screenshots/mobile.png)
- [Local commands and demo boundary](PORTFOLIO.md)

The public deployment is built from the committed source by
`.github/workflows/portfolio-pages.yml`. Review its Actions run for the exact
commit and deployment result; this note is not a claim of production integration
certification, a full accessibility audit or a penetration test.

## Final review — 15 November 2026

The published demo was rechecked in Chromium using Playwright at 1440 × 1040
and 390 × 844. Page identity, meaningful content, absence of framework overlays,
working user interactions and CSV contents all passed. No uncaught JavaScript
errors or page-level horizontal overflow were observed. Desktop and mobile
screenshots were refreshed from the published demo.

The exact routes, viewports and interaction checks are recorded in
[the machine-readable final review](verification/final-review.json).
The finalized source is preserved by the `portfolio-2026-11-15` release tag.
