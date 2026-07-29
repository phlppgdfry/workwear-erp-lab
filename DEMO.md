# Demo Script

A ~10 minute walkthrough of all four pieces, in the order that tells the
clearest story: build a Sales Order by hand, then show the same rules
enforced automatically end to end.

Prerequisites: BC sandbox published (`al-extension`), `webshop-sync` running
with `MOCK_MODE=false` and real credentials in `.env`, `exception-dashboard`
running (`npm run dev` in that folder).

## 1. Variant pricing on a Sales Order (2 min)

1. In Business Central, open **Sales Orders** → any existing order (or new).
2. Add an item line.
3. Scroll right to **Size**, **Color**, **Embroidery / Logo Text**.
4. Type a logo text, e.g. `TEST` — **Embroidery Surcharge** calculates
   automatically (flat fee + per-character fee) and feeds into the line's
   unit price.

Talking point: this is a table extension (`Sales Line Workwear Ext`) plus a
codeunit (`Variant Pricing Mgt`) triggered on `OnValidate` — a minimal,
isolated customization rather than touching standard fields.

## 2. Cross-brand consolidated reporting (2 min)

1. Search **"Brand Company Setup"** — show the list of brand → company
   mappings (this is what you'd populate per acquired brand).
2. Search **"Cross-Brand Sales Consolid"** and run the report.
3. Show the resulting **Brand Sales Overview**: posted invoice count and
   total sales per brand company, without merging the companies.

Talking point: uses `ChangeCompany` to read across companies read-only.
Mention the FlowField bug you hit and fixed (`Amount Including VAT` needed
`CalcFields`) — a good real debugging story.

## 3. Webshop → Business Central sync, live (3 min)

1. Show `webshop-sync/sample-orders/order-be-valid.json` — a fake webshop
   order with size/color/embroidery on its lines.
2. Run: `npm run mock:orders` (or `curl -X POST localhost:4000/webshop-order -d @sample-orders/order-be-valid.json`).
3. Switch to Business Central, open **Sales Orders**, show the newly created
   order — created via the API, not typed by hand.
4. Run `order-unmapped-brand.json` and `order-invalid-quantity.json` — both
   fail on purpose (422 response).

Talking point: brand → company routing lives in config, not code, so
onboarding a newly acquired brand's webshop is a config change. Company and
item lookups resolve name/SKU to BC's internal GUIDs automatically.

## 4. Exception visibility, both sides (2 min)

1. In Business Central, search **"Brand Sync Exceptions"** — show the two
   failed orders from step 3 logged there, with **Mark Resolved**.
2. Open `exception-dashboard` (http://localhost:3000) — the same failures,
   in an external monitoring view non-BC-user support staff could use.

Talking point: this covers the "run" side of the role — second-line support
needs visibility into interface failures, not just build-time customization.

## If something breaks live

- BC sandbox slow to load: mention it's a shared Microsoft-hosted sandbox,
  not a production tenant.
- `webshop-sync` connection error: fall back to `MOCK_MODE=true` and explain
  the mocked flow produces identical payloads, just doesn't call BC.
