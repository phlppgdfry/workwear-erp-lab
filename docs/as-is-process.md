# As-is process

1. A country webshop sends an order to an integration endpoint.
2. The service maps the brand to a Business Central company and creates a
   sales order.
3. Failures are logged for second-line support.

Risks in the original v1 process were duplicate webhook delivery, no difference
between a retryable outage and invalid input, and no downstream warehouse
contract. These are the v2 gaps addressed by the target process.
