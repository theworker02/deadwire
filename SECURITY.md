# Security model

- Provider tokens are server/CLI-only environment values.
- Captured inputs and responses must be sanitized before persistence or simulation.
- Unknown external side effects block automated recovery.
- `SAFE_RESUME` and `SAFE_RESTART` are recommendations, never automatic execution authority.
- Recovery receipts must be immutable, tenant-scoped, and approved before any provider control-plane action.
- Evidence webhooks require an HMAC over the exact body. Reject unsigned requests and rotate `DEADWIRE_INGEST_SECRET` independently of the QStash token.
- The recovery client requires an approved receipt and flow-control configuration, but production deployments must also enforce tenant RBAC and audit every state transition.
- The included JSON store is only for local development. Production evidence needs encryption at rest, retention/deletion policy, and an authenticated Postgres deployment.
