# Console API boundary

The console should call a tenant-authenticated API, never QStash directly.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/incidents` | Search and filter incident queue |
| `GET` | `/v1/incidents/:id` | Incident, timeline, blast radius, cause, plans |
| `POST` | `/v1/incidents/:id/simulations` | Run verifier-backed simulation request |
| `POST` | `/v1/incidents/:id/receipts` | Propose a receipt |
| `POST` | `/v1/receipts/:id/approvals` | Submit role-authenticated approval |
| `GET` | `/v1/recovery-batches/:id` | Read canary/ramp/reconciliation state |
| `GET` | `/v1/audit` | Tenant-scoped audit search |

All mutations require CSRF protection for cookie sessions, role checks, idempotency keys, audit records, and an explicit tenant context.
