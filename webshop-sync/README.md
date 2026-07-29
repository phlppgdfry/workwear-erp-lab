# webshop-sync

Node/TypeScript service that receives webshop orders and syncs them into
Business Central as Sales Orders, applying the same embroidery/personalization
pricing rule as the AL codeunit `Variant Pricing Mgt`, and logging failures as
`Brand Sync Exception` records in BC via a custom API page.

## Run it (mocked, no BC tenant needed)

```bash
cp .env.example .env   # MOCK_MODE=true by default
npm install
npm run dev
```

In a second terminal, replay the sample orders:

```bash
npm run mock:orders
```

Expected outcome:
- `order-be-valid.json` → 201, synced (mocked BC payload logged to console)
- `order-unmapped-brand.json` → 422, brand not mapped -> exception logged
- `order-invalid-quantity.json` → 422, validation error -> exception logged

## Run it against a real BC sandbox

1. Register an Azure AD app, grant it `API.ReadWrite.All` on Business Central,
   get admin consent.
2. Fill in `BC_TENANT_ID`, `BC_CLIENT_ID`, `BC_CLIENT_SECRET`, `BC_ENVIRONMENT`.
3. Set `BRAND_COMPANY_MAP` to your actual BC company names.
4. Deploy `al-extension` to that sandbox first (for the exception API to exist).
5. Set `MOCK_MODE=false`.

## Design notes

- Brand → BC company mapping lives in one place (`config.ts`) so onboarding a
  newly acquired brand is a config change, not a code change.
- Validation and BC-side failures are distinguished (`validation` vs `bc-api`)
  in the logged exception message, so second-line support can tell "bad data
  from the webshop" apart from "BC/API problem" at a glance.
- Personalization pricing is duplicated between AL and this service on
  purpose for the demo; in a real build this would be a single source of
  truth (either always priced in BC, or the webshop price is always trusted
  and BC just records it) — this is exactly the type of standard vs.
  duplicated logic call a fit-gap analysis should catch.
