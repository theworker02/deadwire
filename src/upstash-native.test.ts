import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUpstashDlq, upstashDoctor, UpstashWorkflowAdapter } from "./upstash-native.js";

test("normalizes Upstash-shaped DLQ headers without retaining a raw body beyond failure evidence", () => {
  const run = normalizeUpstashDlq({ dlqId: "dlq-1", createdAt: 0, responseStatus: 422, responseBody: "missing customer_id", url: "https://payments.example/v3", responseHeader: { "upstash-workflow-step": "checkout.finalize", "x-deadwire-step-hash": "abc", "idempotency-key": "seen" } });
  assert.equal(run.id, "dlq-1"); assert.equal(run.step.name, "checkout.finalize"); assert.equal(run.step.idempotencyKeyObserved, true);
});
test("recovery preview always carries flow control and requires an approved receipt", () => {
  const adapter = new UpstashWorkflowAdapter({ token: "test", baseUrl: "https://qstash.example" });
  const preview = adapter.previewResume(["dlq-1", "dlq-2"], { key: "dw-193", parallelism: 2, rate: 1, period: "1s", retries: 3 });
  assert.equal(preview.requiresApprovedReceipt, true); assert.ok(preview.endpoint.includes("resume/dlq-1,dlq-2"));
});
test("doctor blocks unsafe evidence-webhook configuration", () => {
  const report = upstashDoctor({ UPSTASH_QSTASH_TOKEN: "token" });
  assert.equal(report.ready, false); assert.equal(report.checks.find((check) => check.name === "Evidence secret")?.status, "fail");
});
