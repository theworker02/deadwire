# Recovery batch state machine

```text
PROPOSED → CANARY → OBSERVING → RAMPING → RECONCILED
                       │
                       └────────────→ HALTED
```

Only an approved receipt can create a batch. Only `CANARY` and `RAMPING` may issue an Upstash resume request. A recurrence or policy breach moves the batch to `HALTED`; it cannot be resumed without a new operator decision.
