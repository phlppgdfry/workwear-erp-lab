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

See [the connection guide](../docs/power-automate-connection.md) for the
temporary ngrok demo route and the durable Azure Container Apps route. Neither
requires a website; both expose only the integration API.

## Working without Power Automate Premium

The **HTTP** reprocess action is optional and requires Premium. In a standard
license environment, build the approval flow through the three decisions but
omit that action. The approved operator uses `npm run reprocess --
<integrationKey>` on the integration host. This is documented as the manual
fallback rather than presented as an automatic API integration.

## Verified no-Premium flow

A manual cloud flow named **Workwear — Dead Letter Decision** has been created
and successfully run in a Power Automate default environment without a Premium
license. It accepts an `integrationKey`, requests a decision from the assigned
key user, and evaluates **Retry** against the approval result. The flow is not
exported as a solution because the available tenant has no Dataverse capacity;
the portable source blueprint in this folder remains the repository artefact.

The flow does not decide a root cause itself. It turns a terminal technical
state into an auditable business decision, which is the appropriate boundary
for Power Automate.
