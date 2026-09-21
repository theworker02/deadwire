# Deadwire acquisition brief

## One-line description

Deadwire is a recovery-intelligence control plane that makes Upstash Workflow/QStash DLQ recovery evidence-based, safe, and operationally scalable.

## The problem

Durable execution prevents lost work; it does not determine whether a failed execution should replay. At incident scale, an operator needs to know whether thousands of DLQ messages are one cause, whether code is compatible with persisted state, and whether repeating a boundary will duplicate irreversible work.

## The differentiated asset

The core asset is a workflow evidence graph: step/source hashes, deployment provenance, side-effect declarations, idempotency/provider references, traces, and sanitized payload-shape fingerprints are correlated with failure clusters. That makes the recovery recommendation explainable and auditable.

## Why Upstash

Upstash has the relevant primitives—durable workflow state, QStash retry/DLQ semantics, bulk resume, flow control, Redis, and durable agents. Deadwire is intentionally additive: it enriches the decision before and after QStash performs recovery.

## Strategic fit

- Turns DLQ from a retention surface into a recovery product surface.
- Adds differentiated safety for at-least-once delivery and external side effects.
- Extends naturally into agent-quality, token spend, and tool-schema forensics.
- Preserves optional provider-neutral expansion through adapter contracts.

## Commercial shape

Start as a paid recovery-intelligence add-on tied to workflow volume and retained evidence. Enterprise tiers add SSO, extended evidence retention, custom verifier connectors, private deployment, and approval/audit policy controls.

## Diligence artifacts

- `src/sdk.ts`: instrumentation boundary
- `src/upstash-control.ts`: approval-gated resume control
- `src/operations.ts`: incident and policy engine
- `src/production.ts` and `db/schema.sql`: multi-tenant persistence seam
- `docs/DEMO_SCRIPT.md`: repeatable buyer demo
