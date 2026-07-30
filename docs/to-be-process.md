# To-be process

```text
Webshop -> validate + idempotency -> BC Sales Order -> WMS release -> shipment/tracking
                 |                      |                 |
                 +-- permanent error --> dead letter <-----+
                                            |
                                      Power Automate approval
                                  retry / reject / manual correction
```

The integration stores the external identity before it calls BC. A transient
failure is retried with exponential backoff. When a retry is exhausted, an
exception becomes a deliberate key-user decision rather than an invisible log.
