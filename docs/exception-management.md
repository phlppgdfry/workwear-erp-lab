# Exception management

| Category | Example | Automatic behaviour | Key-user action |
| --- | --- | --- | --- |
| Validation | unmapped brand, quantity zero | immediate dead letter | correct mapping/data, then reprocess |
| Transient | 429, 5xx, timeout | three exponential-backoff attempts | approve retry if terminal |
| Permanent | blocked item, unauthorized API | immediate dead letter | correct master data/permission or reject |
| WMS | warehouse unavailable / SKU unknown | retry only the WMS release | retry, correct variant, or reject |

All terminal cases create a BC exception record. The job record preserves the
attempt count, last error, decision context and any confirmed BC/WMS outcome.
