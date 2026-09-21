# Architecture

`Provider adapter → normalizer → local evidence store → failure graph → incident clusterer → safety/compatibility engines → recovery plan → approval-gated receipt`

The core has no provider SDK dependency. Adapters implement `FailureSource`, normalize provider fields into `ExecutionFailure`, and may retain provider-specific evidence in a redacted metadata envelope. The core never invokes a recovery action directly. A future control-plane adapter must require an operator-approved `RecoveryReceipt` and enforce tenant/workflow scope server-side.

The simulator is deterministic: it evaluates a candidate fix against captured sanitized fixtures and emits a per-run result. It is deliberately not a production side-effect emulator; an external call with an unknown outcome remains unsafe.

Phase 2 adds an append-style local evidence store for development, deduplicated on provider execution ID. Agent telemetry uses a separate event shape and detects repeating state cycles before recovery planning. The receipt gate refuses any batch containing a `BLOCK` or `MANUAL_REVIEW` classification.

## 0.2.0 integration architecture

The SDK emits sanitized `WorkflowEvidence` through an HMAC-protected endpoint. It records only shape hashes and hashes of idempotency/provider transaction identifiers. The Upstash recovery adapter calls the documented workflow DLQ resume surface only after a receipt has been approved and a recovery batch enters `CANARY` or `RAMPING`; the canary observation state can halt a recurring failure before ramping.

Production persistence is abstracted through `TenantEvidenceRepository`. The included Postgres adapter uses parameterized tenant-scoped SQL, while identity/RBAC, encrypted vault storage, and provider-verifier credentials remain deployment-owned concerns.
