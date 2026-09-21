import { clusterFailures, makePlan } from "./core.js";
import { candidateStepHashes, failures } from "./fixtures.js";
import { blastRadius, decideRecovery, establishIncident } from "./operations.js";

const incident = clusterFailures(failures)[0];
const plan = makePlan(incident, candidateStepHashes);
const operational = establishIncident(incident);
console.log(JSON.stringify({
  incident: { id: incident.id, severity: operational.severity, state: operational.state, title: operational.title, affectedExecutions: incident.failures.length, firstObserved: incident.firstObserved, commonFailureBoundary: incident.sharedBoundary, correlationConfidence: incident.confidence },
  blastRadius: blastRadius(incident),
  recovery: { classifications: plan.reduce<Record<string, number>>((summary, item) => ({ ...summary, [item.action]: (summary[item.action] ?? 0) + 1 }), {}), decision: decideRecovery(incident, plan, { maxBatchSize: 500, canaryPercent: 1, maxErrorRatePercent: 0.5, requiredApprovals: 2, requiredRoles: ["responder", "approver"] }, [{ actor: "oncall@example.com", role: "responder" }, { actor: "owner@example.com", role: "approver" }]) }
}, null, 2));
