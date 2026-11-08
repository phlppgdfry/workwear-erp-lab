# Verification record

Portfolio refresh · 8 November 2026

- `webshop-sync`: 15 existing Jest tests and TypeScript build passed.
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

## Remaining development-tool advisory

The sync service's Jest configuration dependency still pulls `deepmerge` 4.3.1,
the latest published release checked during this refresh. npm reports one low
severity prototype-poisoning advisory through seven related development packages.
It is absent from production dependencies. No compatible patched release is
available; npm's suggested force fix downgrades Jest to 25.1.0. That downgrade
was not applied. Keep test configuration trusted and revisit the upstream patch
or a deliberate test-runner migration separately.

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
