# Test strategy

The CI workflow installs, builds and tests every Node component. Unit tests
cover brand routing, required data, personalization pricing, duplicate webhook
delivery and retry-to-dead-letter behaviour.

The acceptance demo covers valid order, unmapped brand, invalid quantity,
duplicate delivery, BC/WMS outage, recovery through retry, unknown warehouse
SKU and partial shipment. Live BC validation is performed separately in a
sandbox with non-production credentials; no real company data is included.
