import test from "node:test";
import assert from "node:assert/strict";
import { detectAgentLoops } from "./agent-forensics.js";
import { clusterFailures, makePlan } from "./core.js";
import { candidateStepHashes, failures } from "./fixtures.js";
import { createRecoveryReceipt, RecoveryGateError } from "./recovery.js";

test("detects an agent state cycle and estimates wasted calls", () => {
  const events = ["search", "evaluate", "search", "evaluate", "search", "evaluate"].map((state, sequence) => ({ runId: "a", agent: "researcher", sequence, state, semanticProgress: 0.03, modelCalls: 1, timestamp: "2026-09-21T00:00:00Z" }));
  const loop = detectAgentLoops(events)[0];
  assert.equal(loop.iterations, 6);
  assert.equal(loop.estimatedUnnecessaryModelCalls, 4);
});
test("rejects a recovery receipt when any execution is unsafe", () => {
  const incident = clusterFailures(failures)[0];
  let rejected = false;
  try { createRecoveryReceipt(incident, makePlan(incident, candidateStepHashes), "operator"); } catch (error) { rejected = error instanceof RecoveryGateError; }
  assert.equal(rejected, true);
});
test("creates a proposed receipt for an all-safe incident", () => {
  const incident = clusterFailures(failures).find((item) => item.sharedBoundary.includes("object-store"))!;
  const receipt = createRecoveryReceipt(incident, makePlan(incident, candidateStepHashes), "operator", "2026-09-21T16:00:00Z");
  assert.equal(receipt.status, "PROPOSED");
  assert.equal(receipt.actions.SAFE_RESUME, 2);
});
