# exception-dashboard

Minimal Next.js app for second-line monitoring: shows webshop → Business
Central sync failures (from `webshop-sync`) and lets support mark them
resolved.

Runs in two modes, chosen automatically by `lib/exceptions.ts`:

- **Mock mode** (default, no setup needed) — an in-memory store in
  `lib/data.ts`, seeded with the same failure scenarios `webshop-sync`'s
  sample orders produce (unmapped brand, invalid line quantity).
- **Live mode** — reads/writes the real `syncExceptions` entity from the
  al-extension's custom API page, via `lib/bc.ts`.

## Run in mock mode

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Run in live mode

```bash
cp .env.local.example .env.local
# fill in the same Azure AD app registration credentials used by
# webshop-sync, plus BC_COMPANY_NAME (the company to read exceptions from)
npm run dev
```

The page footer text indicates which mode is active.
