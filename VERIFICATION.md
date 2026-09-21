# Verification report

## Release target

Deadwire `1.9.1` is frozen only after the commands below complete successfully on the release workspace.

## Automated checks

```powershell
npm run typecheck
npm test
npm run demo
npm run benchmark
node --check site/app.js
```

### Behavioral coverage

- Failure clustering and shared-boundary correlation
- Unsafe external-effect blocking and safe deterministic replay classification
- Workflow compatibility gates
- HMAC evidence validation and secret non-retention
- Approval receipt, canary halt, ramp, and reconciliation state behavior
- Deployment compatibility and dependency trace correlation
- Agent-loop detection and cost-oriented evidence
- Alert routing, causal hypotheses, and retention/legal-hold policy
- Upstash DLQ normalization, recovery-preview flow control, and diagnostic guardrails
- Payment/delivery verifier ambiguity handling

The test suite is deterministic and uses sanitized fixtures only. It does not contact Upstash or any external provider.

## Benchmark methodology

`npm run benchmark` generates a deterministic corpus from the sanitized checkout fixture and measures the in-process core path: incident clustering, plan generation, deterministic simulation, cause hypothesis, blast radius, and policy decision. It is a development benchmark, not a claim about distributed production throughput, database performance, or Upstash API latency.

See [BENCHMARKS.md](BENCHMARKS.md) for the recorded release run.
