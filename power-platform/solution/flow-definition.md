# Flow build definition

Create an **Automated cloud flow** in a solution called `Workwear Operational
Integration`. Use a Business Central trigger or a scheduled poll of the custom
`syncExceptions` endpoint if the tenant connector cannot subscribe to this
custom API.

| Step | Action | Configuration |
| --- | --- | --- |
| 1 | Trigger/filter | `processingStatus = DeadLetter`, `resolved = false` |
| 2 | Compose | Store `integrationKey`, category, retry count and reference |
| 3 | Start and wait for an approval | Assigned to `WORKWEAR_APPROVER_GROUP`; choices: Retry, Manual correction, Reject |
| 4a | HTTP (Retry branch) | `POST @{WORKWEAR_INTEGRATION_BASE_URL}/operations/@{integrationKey}/reprocess` |
| 4b | Teams/Planner (Manual correction) | Include error, order reference, brand and a BC deep link |
| 4c | Update BC exception (Reject) | `resolved=true`, write decision note/actor in the environment's audit mechanism |
| 5 | Update BC exception (Retry) | `reprocessRequested=true`; retain it until the integration reports completion |

Configure secure inputs/outputs for the HTTP action and use a service principal
or managed connector connection. Add the `approvalId`, outcome, decision time
and reprocess response to Dataverse/audit logging where that is standard in the
target environment.
