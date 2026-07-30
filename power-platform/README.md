# Power Platform — operational exception approval

This folder contains the environment-neutral source blueprint for the v2 flow.
It deliberately contains no tenant URLs, connector connections or credentials.
Build/export the flow in the target Power Platform environment, then store the
exported managed/unmanaged solution alongside this blueprint if the environment
permits it.

## Flow: `Workwear — dead-letter decision`

**Trigger:** When a Business Central `syncException` is created or updated with
`processingStatus = DeadLetter` and `resolved = false`.

1. Read category, retry count, order reference and integration key.
2. Create an Approval for the designated brand key user.
3. Decision `Retry`: call `POST {integration base}/operations/{integrationKey}/reprocess`, add the response to the approval history, then mark the BC record as reprocess requested.
4. Decision `Manual correction`: create a Planner/Teams task with the order
   reference and error; retain the exception open.
5. Decision `Reject`: update the BC exception as resolved with a rejection
   note; no automatic reprocess occurs.

Use the detailed recipe in [solution/flow-definition.md](solution/flow-definition.md),
the architecture in [diagrams/exception-approval-flow.md](diagrams/exception-approval-flow.md),
and the representative trigger body in [sample-payloads/dead-letter.json](sample-payloads/dead-letter.json).

## Required connections and environment variables

- **Business Central:** connection to the extension API, with rights to update
  exception records.
- **Approvals**, optionally **Teams** and **Planner** for operational tasks.
- `WORKWEAR_INTEGRATION_BASE_URL`: HTTPS address of `webshop-sync`; use a
  private gateway/API Management in production, never a laptop localhost URL.
- `WORKWEAR_APPROVER_GROUP`: key-user group/email for the brand.

The flow does not decide a root cause itself. It turns a terminal technical
state into an auditable business decision, which is the appropriate boundary
for Power Automate.
