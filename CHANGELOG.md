# Changelog

## 1.9.1 — 2026-09-21

### Upstash-native hardening

- Added `UpstashWorkflowAdapter` for paginated DLQ inspection, normalized provider evidence, and exact recovery previews with mandatory flow control.
- Added `UpstashEvidenceBridge` for owned Workflow step and Workflow Agent tool boundaries.
- Added `deadwire doctor` to prevent unsafe evidence/recovery configuration from being mistaken for production readiness.
- Added targeted Upstash integration documentation and an integration blueprint for a potential Upstash product surface.
- Added alert routing, causal hypotheses, retention-policy evaluation, reusable runbooks, versioned recovery policy examples, schemas, connector contracts, and a hosted-product conversion plan.
- Added an animated recovery walkthrough and full-screen presentation for the static GitHub Pages demo.

## 1.9.0 — 2026-09-21

### Acquisition-ready product surface

- Added an interactive static product and incident demo site designed for GitHub Pages.
- Added a proprietary evaluation license, release notes, demo script, product brief, deployment guide, and integration guide.
- Added the GitHub Pages deployment workflow.

### Operations intelligence

- Added operational incident lifecycle, severity derivation, ownership/timeline models, blast-radius analysis, and runbook matching.
- Added policy-driven recovery decisions: approval separation, batch ceilings, canary/error thresholds, and signed decision IDs.
- Added a `npm run demo` command for a deterministic operator-facing incident walkthrough.

### Existing 0.x foundations incorporated into 1.9

- Signed workflow evidence SDK and ingestion endpoint.
- QStash recovery control with approval receipt, flow control, canary, halt, ramp, and reconciliation states.
- Side-effect verifier contracts, deployment compatibility gates, trace correlation, agent loop detection, multi-tenant persistence/RBAC/audit contracts.

## 0.2.0 — 2026-09-21

Initial evidence ingestion, recovery control, agent forensics, and production persistence seam.
