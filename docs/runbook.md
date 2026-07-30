# Runbook

1. Check `/health`, then inspect the operation by its idempotency key.
2. For `retryScheduled`, let the worker call `POST /operations/retry-due`.
3. For `deadLetter`, read category and last error; check BC exception record.
4. Correct source data, mapping, BC master data or downstream availability.
5. Obtain approval where required, then call `POST /operations/{key}/reprocess`.
   Without Power Automate Premium, run `npm run reprocess -- <key>` on the
   integration host after the approved Retry decision.
6. Verify the final state is `completed`, and confirm WMS tracking where it is
   configured. Record root cause and follow up recurring errors.

Never delete a job to make a failure disappear: its idempotency record prevents
duplicate orders and forms the audit trail.
