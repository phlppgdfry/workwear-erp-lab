# WMS simulator

This small Express service completes the demo landscape without pretending to
be a full warehouse system. `POST /warehouse-orders` validates a release,
returns a tracking number, and is idempotent per order reference.

```bash
npm install
npm run dev
```

Then set `WMS_URL=http://localhost:4100` in `webshop-sync/.env`. Known SKUs
are `1896-S`, `PPE-GLOVE-CUT5`, and `DSY-JKT-NAVY`. `PPE-GLOVE-CUT5` returns a
partial shipment deliberately; unknown SKUs return a validation failure.
