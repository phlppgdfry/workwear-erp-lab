# Fit-Gap Notes — Workwear ERP Lab Scenario

Short solution-design write-up, in the style expected from an ERP Business
Analyst: business need → standard BC capability → gap → chosen solution.

## 1. Personalized garments (embroidery/logo) need a price surcharge

- **Standard BC**: Sales Line pricing supports item price + line discount,
  but has no native "customization surcharge" concept tied to free text.
- **Gap**: need a rule (flat fee + per-character fee) triggered by an
  embroidery/logo text field that doesn't exist on the standard line.
- **Solution**: minimal table extension (`Sales Line Workwear Ext`) + one
  codeunit (`Variant Pricing Mgt`) invoked from a field's `OnValidate`.
  Kept out of standard fields on purpose — easy to isolate, test, and remove
  if a future PIM/PLM system takes over pricing.
- **Standardization discipline**: pricing logic lives in exactly one place in
  BC (the codeunit); `webshop-sync` mirrors it only so a webshop order is
  priced consistently before it reaches BC, not as a second source of truth
  long-term — flagged in `webshop-sync/README.md` as something to resolve in
  a real build (webshop trusts BC price via a synchronous price lookup, or
  BC trusts the webshop price and only audits it).

## 2. Cross-brand reporting after acquiring two brands, without merging companies

- **Standard BC**: reporting is company-scoped; consolidation normally means
  either merging companies (loses brand-level autonomy) or exporting to Power
  BI (adds a dependency and lag).
- **Gap**: management wants a same-day, in-BC view across brand companies
  without merging them or waiting on a BI refresh.
- **Solution**: `Brand Company Setup` table lists active brand companies;
  `Cross-Brand Sales Consolidation` report loops over them with
  `ChangeCompany` and aggregates into a temporary buffer, shown in
  `Brand Sales Overview`. Read-only, no schema changes to the underlying
  companies — low risk, revisit only if reporting needs grow beyond a
  request-page date filter.

## 3. Webshop orders per country need to land as BC Sales Orders in the right company

- **Standard BC**: the `salesOrders` API entity already supports creating
  orders with lines; no custom API needed for the happy path.
- **Gap**: (a) brand → company routing isn't a BC concept, (b) failures need
  to be visible to second-line support instead of silently dropped.
- **Solution**: routing lives in `webshop-sync` config (a JSON map), so
  onboarding a newly acquired brand's webshop is a config change, not a
  redeploy. Failures are written to a small custom table
  (`Brand Sync Exception`) exposed as a custom API page, so they show up
  inside BC next to everything else support already monitors — avoids
  standing up a separate logging system.

## 4. Run-side visibility

- **Gap**: "opvolgen van interfaces, exception reporting" needs a place to
  look, not just log lines in a service nobody watches.
- **Solution**: `Brand Sync Exceptions` list page inside BC (for functional
  key users) plus `exception-dashboard`, a lightweight external viewer
  reading the same data — covers both "someone in BC checks this" and
  "someone gets a dashboard link" without building two systems.
