# Deadwire — architecture

Deadwire is a recovery-intelligence control plane for durable Upstash workflows. Upstash remains the **execution authority**; Deadwire is the **decision authority** for evidence, compatibility, policy, receipts, and promotion.

## Control-plane flow

```text
Customer application (Workflow · QStash · agents · external services)
        │                          │
        │ Deadwire SDK bridge      │ failure callback / DLQ
        └────────────┬─────────────┘
                     ▼
          HMAC-signed evidence ingestion
                     ▼
 evidence graph → incident clustering → deployment / trace correlation
                     ▼
   compatibility gate + side-effect verifiers + simulation
                     ▼
receipt → independent approval → 1% canary → observe → ramp → reconcile
                     ▼
      QStash resume with required flow-control configuration
```

## Design boundaries

1. Workflow state, retries, DLQ retention, and resume stay on Upstash.
2. Ambiguity fails closed—unverified side effects or compatibility block automated recovery.
3. No browser-held secrets; HMAC and provider credentials are server-side only.
4. Default evidence uses hashes and structural fingerprints, not raw sensitive payloads.

## Repository map

| Area | Role |
| --- | --- |
| `src/core` | Evidence model, incidents, compatibility, simulation |
| `src/integrations` | Upstash-native ingest and resume adapters |
| `src/server` | Local dashboard and API surface |
| `dist/*.test.js` | Node test suite (built from TypeScript sources) |

## Testing

```powershell
npm test
```

Runs `tsc` build then Node's test runner over core, integration, and platform suites.

## Diligence

See [../ACQUISITION.md](../ACQUISITION.md) and [acquisition/REPRODUCTION_COST.md](./acquisition/REPRODUCTION_COST.md).
