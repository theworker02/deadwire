import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRetry, clusterFailures, makePlan, simulate } from "./core.js";
import { candidateStepHashes, failures } from "./fixtures.js";

test("clusters matching provider contract failures into one incident", () => {
  const incidents = clusterFailures(failures);
  assert.equal(incidents[0].failures.length, 10);
  assert.ok(incidents[0].sharedBoundary.includes("payments-api/v3"));
});
test("blocks retries with unknown external effects", () => {
  const risk = analyzeRetry(failures[9].step);
  assert.equal(risk.risk, "UNSAFE");
  assert.equal(makePlan(clusterFailures(failures)[0], candidateStepHashes).find((item) => item.executionId === failures[9].id)?.action, "BLOCK");
});
test("simulates deterministic idempotent work with sanitized state", () => {
  const thumbnail = clusterFailures(failures).find((incident) => incident.sharedBoundary.includes("object-store"))!;
  assert.equal(simulate(thumbnail, candidateStepHashes).every((item) => item.passed), true);
});
