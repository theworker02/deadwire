import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { WorkflowRecorder, type EvidenceEmitter } from "./sdk.js";
import { validateWorkflowEvidence, verifyHmacSignature } from "./webhooks.js";
import { beginCanary, observeCanary, proposeBatch, rampBatch } from "./upstash-control.js";
import { analyzeDeploymentCompatibility, correlateTraces } from "./intelligence.js";
import type { WorkflowEvidence } from "./contracts.js";

test("SDK emits sanitized step evidence and never retains raw keys", async () => {
  let evidence: WorkflowEvidence | undefined;
  const emitter: EvidenceEmitter = { emit: async (value) => { evidence = value; } };
  const recorder = new WorkflowRecorder("tenant", "run", { workflow: "checkout", workflowVersion: "v1", deploymentSha: "abc", environment: "production" }, emitter);
  await recorder.run("charge", () => undefined, async () => ({ receipt: "provider secret" }), { sideEffect: "payment", idempotencyKey: "idem_secret", request: { amount: 100, customer: "secret" } });
  await recorder.flush();
  assert.equal(evidence?.steps[0].completed, true);
  assert.ok(evidence?.steps[0].idempotencyKeyHash);
  assert.equal(JSON.stringify(evidence).includes("idem_secret"), false);
});

test("evidence webhooks require a valid HMAC and schema", () => {
  const body = JSON.stringify({ tenantId: "tenant", runId: "run", provenance: { workflow: "w" }, steps: [{ step: "one", stepHash: "hash", completed: true }], emittedAt: "2026-01-01T00:00:00Z" });
  const secret = "test-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  verifyHmacSignature(body, `sha256=${signature}`, secret);
  assert.equal(validateWorkflowEvidence(JSON.parse(body)).runId, "run");
});

test("recovery batch must canary, halt on recurrence, and only ramp a clean canary", () => {
  const receipt = { id: "RC-safe", incidentId: "DW-1", createdAt: "now", proposedBy: "a", status: "APPROVED" as const, planHash: "hash", actions: { SAFE_RESUME: 2 }, evidence: [] };
  const proposed = proposeBatch(receipt, ["a", "b"], { key: "incident-dw-1", parallelism: 2, rate: 1, period: "1s", retries: 3 });
  const halted = observeCanary(beginCanary(proposed), true);
  assert.equal(halted.state, "HALTED");
  assert.equal(rampBatch(observeCanary(beginCanary(proposed), false)).state, "RAMPING");
});

test("deployment compatibility blocks changes to completed workflow steps", () => {
  const evidence: WorkflowEvidence = { tenantId: "t", runId: "r", emittedAt: "now", provenance: { workflow: "checkout", workflowVersion: "v1", deploymentSha: "old", environment: "production" }, steps: [{ step: "validate", stepHash: "v", ordinal: 0, completed: true, sideEffect: "none" }] };
  const report = analyzeDeploymentCompatibility(evidence, { tenantId: "t", provider: "github", sha: "new", deployedAt: "now", environment: "production", changedFiles: ["workflows/checkout.ts"], changedPackages: ["zod"] }, { validate: "workflows/checkout.ts" });
  assert.equal(report.safe, false);
});

test("trace aggregation groups a failing shared dependency", () => {
  const boundaries = correlateTraces([{ tenantId: "t", traceId: "1", spanId: "1", service: "checkout", dependency: "payments-api", deploymentSha: "abc", status: "error", timestamp: "now", attributes: {} }, { tenantId: "t", traceId: "2", spanId: "2", service: "order", dependency: "payments-api", deploymentSha: "abc", status: "error", timestamp: "now", attributes: {} }]);
  assert.equal(boundaries[0].errorRate, 100);
});
