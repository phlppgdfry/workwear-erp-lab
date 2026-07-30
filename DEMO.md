# Demo Script

A ~15 minute walkthrough of the complete v2 landscape, in the order that tells the
clearest story: build a Sales Order by hand, then show the same rules
enforced automatically end to end.

Prerequisites: BC sandbox published (`al-extension`) for the live version,
`webshop-sync` running, `exception-dashboard` running (`npm run dev` in that
folder), and optionally `wms-mock` on port 4100. The entire flow also works in
mock mode without a BC account.

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

## 4. Idempotency, retry and dead-letter operations (3 min)

1. Post `order-be-valid.json` twice. The first response is `201 completed`;
   the second is `200 duplicate` with the original job — no second BC order.
2. Stop the WMS simulator temporarily and submit a valid order with
   `WMS_URL` configured. The job remains `bcSynced` and `wmsRetryScheduled`:
   BC is not called again.
3. Call `POST /operations/retry-due` after restarting WMS. The same job now
   completes. To demonstrate the terminal path, keep WMS unavailable through
   the configured three attempts; it becomes `deadLetter`.
4. A key user can send `POST /operations/{idempotencyKey}/reprocess` after
   correcting the root cause. This action is the endpoint the Power Automate
   approval blueprint calls after a **Retry** decision.

Talking point: a network error is not bad business data. The exception category
and retry policy make that difference explicit, and the BC/WMS boundary avoids
the classic duplicate-order failure.

## 5. Warehouse release, partial shipping and tracking (2 min)

1. Start `wms-mock` and set `WMS_URL=http://localhost:4100` for webshop-sync.
2. Submit `sample-orders/order-fr-partial-shipment.json`.
3. Open `GET http://localhost:4100/shipments/WEB-FR-400120` to show a
   `partiallyShipped` response and tracking number.

Talking point: the mock deliberately verifies warehouse contracts (SKU,
quantity, idempotent release) instead of claiming to be a WMS.

## 6. Exception visibility and Power Automate hand-off (3 min)

1. In Business Central, search **"Brand Sync Exceptions"** — show the two
   failed orders from step 3 logged there, with **Mark Resolved**.
2. Open `exception-dashboard` (http://localhost:3000) — the same failures,
   in an external monitoring view non-BC-user support staff could use.

Talking point: this covers the "run" side of the role — second-line support
needs visibility into interface failures, not just build-time customization.
Open `power-platform/README.md` and show the approval decision table: validation
errors go to manual correction, transient dead letters offer retry/reject, and
the audit trail stays with the operational exception.

## If something breaks live

- BC sandbox slow to load: mention it's a shared Microsoft-hosted sandbox,
  not a production tenant.
- `webshop-sync` connection error: fall back to `MOCK_MODE=true` and explain
  the mocked flow produces identical payloads, just doesn't call BC.
