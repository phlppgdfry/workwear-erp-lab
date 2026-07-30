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
- `order-be-valid.json` → 201, completed (mocked BC payload)
- Replay it → 200, `duplicate`; the existing job is returned and BC is not called again
- `order-unmapped-brand.json` / `order-invalid-quantity.json` → 422,
  `deadLetter`; a BC exception is logged for key-user review

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
- A file-backed job store makes the local demo restart-safe. The key is
  `brand::webshopCountry::orderReference`; in production this interface is a
  database table with a unique index, not a JSON file.
- Transient errors (`408`, `429`, `5xx` and network/timeout errors) receive
  exponential backoff. Validation and other permanent failures dead-letter
  immediately. Trigger due jobs with `POST /operations/retry-due`; recover a
  corrected dead letter with `POST /operations/{idempotencyKey}/reprocess`.
- If `WMS_URL` is set, WMS release happens only *after* the BC order succeeds.
  A WMS retry retains `bcSynced`, so it cannot create a duplicate BC order.
- Before exposing the service through a tunnel or cloud host, set
  `INTEGRATION_API_KEY` and send it in the `x-api-key` header. This protects
  webhook delivery and operational reprocess/retry endpoints; `/health` stays
  public for hosting probes.

## No-Premium Power Automate fallback

The generic Power Automate HTTP connector is Premium. A standard-license
approval flow can still capture the key-user decision; after an approved
**Retry**, run this locally on the secure integration host:

```bash
npm run reprocess -- SHOETEQ::NL::WEB-NL-200011
```

The command reads `INTEGRATION_API_KEY` from the local `.env`; the secret never
needs to be placed in Power Automate. When a Premium license is available, the
same reprocess operation can be automated with the HTTP action described in
`power-platform/`.
