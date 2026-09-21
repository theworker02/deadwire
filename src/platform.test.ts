import test from "node:test";
import assert from "node:assert/strict";
import { routeIncident } from "./alerting.js";
import { hypothesizeCause } from "./cause-analysis.js";
import { clusterFailures } from "./core.js";
import { failures } from "./fixtures.js";
import { establishIncident } from "./operations.js";
import { retentionCandidates } from "./retention.js";

test("routes a high-severity incident to configured operators", () => {
  const operational = establishIncident(clusterFailures(failures)[0]); operational.severity = "SEV1";
  assert.equal(routeIncident(operational, [{ id: "primary", severities: ["SEV1"], channels: ["slack", "pagerduty"], requireAcknowledgement: true }]).length, 2);
});
test("recognizes a contract-change hypothesis from shape and client-error evidence", () => {
  assert.equal(hypothesizeCause(clusterFailures(failures)[0]).class, "DEPENDENCY_CONTRACT_CHANGE");
});
test("retention respects legal hold while selecting expired evidence", () => {
  const candidates = retentionCandidates([{ id: "expired", tenantId: "a", kind: "evidence", createdAt: "2026-01-01T00:00:00Z" }, { id: "hold", tenantId: "hold", kind: "evidence", createdAt: "2026-01-01T00:00:00Z" }], { evidenceDays: 30, rawFixtureDays: 7, auditDays: 365, legalHoldTenants: ["hold"] }, new Date("2026-09-21T00:00:00Z"));
  assert.deepEqual(candidates.map((item) => item.id), ["expired"]);
});
