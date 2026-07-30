# Exception approval flow

```text
DeadLetter in BC custom API
           |
           v
Power Automate filter + Approval
  | Retry              | Manual correction        | Reject
  v                    v                          v
POST integration       Teams/Planner task          Close with audit note
/reprocess             + keep BC exception open
  |
  v
Integration job completed or remains dead letter -> BC/dashboard visibility
```
