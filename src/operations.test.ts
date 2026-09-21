import test from "node:test";
import assert from "node:assert/strict";
import { clusterFailures, makePlan } from "./core.js";
import { candidateStepHashes, failures } from "./fixtures.js";
import { blastRadius, decideRecovery, establishIncident, matchRunbooks } from "./operations.js";

test("operational incident derives severity and blast radius", () => {
  const incident = clusterFailures(failures)[0];
  assert.equal(establishIncident(incident).severity, "SEV3");
  assert.equal(blastRadius(incident).dependencies[0], "payments-api/v3");
});
test("recovery guardrails refuse unsafe plans even with approvals", () => {
  const incident = clusterFailures(failures)[0];
  const decision = decideRecovery(incident, makePlan(incident, candidateStepHashes), { maxBatchSize: 100, canaryPercent: 1, maxErrorRatePercent: 1, requiredApprovals: 2, requiredRoles: ["responder", "approver"] }, [{ actor: "a", role: "responder" }, { actor: "b", role: "approver" }]);
  assert.equal(decision.allowed, false);
});
test("runbooks match the incident boundary", () => {
  const incident = clusterFailures(failures)[0];
  assert.equal(matchRunbooks(incident, [{ id: "RB-payment", title: "Payment schema triage", appliesTo: { dependency: "payments-api/v3" }, steps: [{ instruction: "Validate API response compatibility.", required: true }] }]).length, 1);
});
