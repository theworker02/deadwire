# Benchmarks

## Reproducible command

```powershell
npm run benchmark
```

The command defaults to 10,000 synthetic, sanitized failed executions and can accept a run count from 1 to 100,000:

```powershell
npm run benchmark -- 50000
```

## What is measured

- deterministic incident fingerprinting and clustering
- recovery-plan construction
- deterministic simulation classification
- causal-hypothesis classification
- blast-radius derivation
- approval-policy decision

## What is not measured

This benchmark excludes network I/O, QStash API calls, Postgres, external side-effect verifiers, encryption, browser rendering, and multi-tenant worker scheduling. It is intentionally an implementation-level signal, not a fabricated production-scale claim.

## Release result

The release run is recorded below after executing the reproducible command on the local Windows/Node 20+ workspace.

```json
{
  "benchmark": "deadwire-core-fixture",
  "runs": 10000,
  "incidents": 1,
  "clusteringMs": 46.32,
  "clusteringRunsPerSecond": 215875,
  "analysisMs": 3.87,
  "plannedExecutions": 10000,
  "simulatedExecutions": 10000,
  "causeClass": "DEPENDENCY_CONTRACT_CHANGE",
  "blastRadiusExecutions": 10000,
  "recoveryAllowed": false,
  "runtime": { "node": "v24.16.0", "platform": "win32" }
}
```

The result demonstrates the deterministic in-process reference path, not network, storage, or distributed-worker capacity. Run the command again on the target environment before using it in a performance decision.
