# exception-dashboard

Minimal Next.js app for second-line monitoring: shows webshop → Business
Central sync failures (from `webshop-sync`) and lets support mark them
resolved. Backed by an in-memory mock store seeded with the same failure
scenarios `webshop-sync`'s sample orders produce (unmapped brand, invalid
line quantity), so it's demoable standalone.

In a real deployment, `lib/data.ts` would call the `syncExceptions` entity
from the AL extension's custom API page instead of the in-memory array —
same shape, real backend.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.
