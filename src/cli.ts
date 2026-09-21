import { candidateStepHashes, failures } from "./fixtures.js";
import { clusterFailures, makePlan, simulate } from "./core.js";
import { detectAgentLoops } from "./agent-forensics.js";
import { createRecoveryReceipt, RecoveryGateError } from "./recovery.js";
import { upstashDoctor } from "./upstash-native.js";

const command = process.argv[2] ?? "help";
const incidents = clusterFailures(failures);
const incidentId = process.argv[3] ?? "DW-193";
const incident = incidents.find((item) => item.id === incidentId) ?? incidents[0];

if (command === "inspect") {
  console.log(JSON.stringify({ incident: { id: incident.id, affectedExecutions: incident.failures.length, firstObserved: incident.firstObserved, commonFailureBoundary: incident.sharedBoundary, confidence: incident.confidence }, failures: incident.failures.map((run) => run.id) }, null, 2));
} else if (command === "plan") {
  console.log(JSON.stringify({ incident: incident.id, plan: makePlan(incident, candidateStepHashes) }, null, 2));
} else if (command === "simulate") {
  const results = simulate(incident, candidateStepHashes);
  console.log(JSON.stringify({ incident: incident.id, passed: results.filter((result) => result.passed).length, total: results.length, results }, null, 2));
} else if (command === "receipt") {
  try { console.log(JSON.stringify(createRecoveryReceipt(incident, makePlan(incident, candidateStepHashes), process.argv[4] ?? "cli-operator"), null, 2)); }
  catch (error) { process.exitCode = 2; console.error(error instanceof RecoveryGateError ? error.message : "Unable to create recovery receipt."); }
} else if (command === "loops") {
  const events = ["search", "evaluate", "search", "evaluate", "search", "evaluate"].map((state, sequence) => ({ runId: "agent-7a21", agent: "researcher", sequence, state, semanticProgress: 0.03, modelCalls: 1, timestamp: `2026-09-21T14:0${sequence}:00Z` }));
  console.log(JSON.stringify(detectAgentLoops(events), null, 2));
} else if (command === "doctor") {
  console.log(JSON.stringify(upstashDoctor(process.env), null, 2));
} else {
  console.log("Deadwire CLI\n  inspect <dlq-id>\n  plan <incident-id>\n  simulate <incident-id>\n  receipt <incident-id> [operator]\n  loops\n  doctor");
}
