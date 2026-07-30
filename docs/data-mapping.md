# Data mapping

| Dealer webshop | Business Central | WMS release | Rule |
| --- | --- | --- | --- |
| `brand` | target company | `brand` | `BRAND_COMPANY_MAP` routes the legal entity |
| `orderReference` | external document number | `orderReference` | uniqueness key component |
| `customerNumber` | sell-to customer | — | validated before BC creation |
| `sku` | item number → item GUID | `sku` | unknown WMS SKU is a business error |
| `size`, `color` | line description / extension | line attributes | retained for fulfilment context |
| `embroideryText` | unit-price surcharge | — | pricing rule mirrors AL codeunit |
| WMS tracking number | shipment reference (future API) | `trackingNumber` | output for webshop notification |
