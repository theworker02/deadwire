import { clusterFailures, makePlan, simulate } from "./core.js";
import { hypothesizeCause } from "./cause-analysis.js";
import { candidateStepHashes, failures } from "./fixtures.js";
import { blastRadius, decideRecovery } from "./operations.js";

const runs = Number(process.argv[2] ?? "10000");
if (!Number.isSafeInteger(runs) || runs < 1 || runs > 100_000) throw new Error("Benchmark run count must be an integer from 1 to 100000.");
const corpus = Array.from({ length: runs }, (_, index) => ({ ...failures[index % 10], id: `bench_${index}`, failedAt: new Date(Date.parse("2026-09-21T14:00:00Z") + index).toISOString() }));
const started = performance.now();
const incidents = clusterFailures(corpus);
const clusteringMs = performance.now() - started;
const incident = incidents[0];
const analysisStarted = performance.now();
const plan = makePlan(incident, candidateStepHashes);
const simulation = simulate(incident, candidateStepHashes);
const cause = hypothesizeCause(incident);
const radius = blastRadius(incident);
const decision = decideRecovery(incident, plan, { maxBatchSize: 100_000, canaryPercent: 1, maxErrorRatePercent: 1, requiredApprovals: 2, requiredRoles: ["responder", "approver"] }, [{ actor: "benchmark-responder", role: "responder" }, { actor: "benchmark-approver", role: "approver" }]);
const analysisMs = performance.now() - analysisStarted;
console.log(JSON.stringify({
  benchmark: "deadwire-core-fixture",
  runs,
  incidents: incidents.length,
  clusteringMs: Number(clusteringMs.toFixed(2)),
  clusteringRunsPerSecond: Number((runs / (clusteringMs / 1000)).toFixed(0)),
  analysisMs: Number(analysisMs.toFixed(2)),
  plannedExecutions: plan.length,
  simulatedExecutions: simulation.length,
  causeClass: cause.class,
  blastRadiusExecutions: radius.executions,
  recoveryAllowed: decision.allowed,
  runtime: { node: process.version ?? "unknown", platform: process.platform ?? "unknown" }
}, null, 2));
