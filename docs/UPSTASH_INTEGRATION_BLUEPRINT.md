# Upstash product integration blueprint

## Product premise

Deadwire should be positioned as recovery correctness for Upstash Workflow and QStash—not a new orchestration engine, observability dashboard, or generic incident product.

## Native customer flow

1. A developer installs the Deadwire instrumentation bridge next to owned `context.run`, `context.call`, and agent-tool boundaries.
2. Upstash Workflow continues to execute and retry exactly as it does today.
3. A terminal failure reaches DLQ and the Deadwire connector imports the DLQ record plus sanitized workflow evidence.
4. Deadwire correlates affected executions, deployment signals, trace boundaries, agent behavior, and verifier results into an incident.
5. The Upstash Console can render a **Deadwire Recovery** tab showing cause, replay classification, compatibility, and required evidence.
6. An authorized operator proposes a batch. Deadwire requires policy approvals and emits a QStash resume preview containing flow-control headers.
7. A trusted control worker starts the canary. If the prior failure signature recurs, the batch halts. Otherwise it ramps and produces a receipt linking DLQ records to new workflow run IDs.

## Where it belongs in Upstash

| Upstash surface | Deadwire augmentation |
| --- | --- |
| Workflow DLQ | Incident grouping, recovery safety, compatibility, and batch protocol |
| Workflow logs | Step/source/deployment provenance and dependency boundary evidence |
| QStash flow control | Required canary/ramp guardrails for recovery waves |
| Workflow Agents | Tool-loop detection, cost/waste attribution, tool-schema drift, checkpoint guidance |
| Redis | Optional evidence index, incident cache, and recovery receipt lookup |

## Technical boundaries

- Upstash remains source of truth for execution, retries, DLQ retention, and actual resume.
- Deadwire remains source of truth for recovery evidence, policy decisions, and receipts.
- No browser token is acceptable. Connector and control credentials remain server-side.
- Deadwire must tolerate missing instrumentation by classifying ambiguity as manual review rather than guessing.

## Suggested internal product phases

### Phase A: Console companion

Read-only incident grouping, DLQ annotations, and workflow compatibility report. This creates immediate value without workflow mutation.

### Phase B: Guarded recovery

Receipt approval, flow-controlled canary resume, reconciliation, and audit history. The customer stays in control while Upstash executes recovery.

### Phase C: Agent operations

Token/cost telemetry, loop detection, duplicate-tool suppression recommendations, and tool contract alerts across durable agent runs.

### Phase D: Cross-provider intelligence

Provider-neutral connectors make the evidence model strategically durable while retaining an Upstash-native first experience.
