import { createHash } from "node:crypto";
import type { Incident, PlanItem } from "./core.js";
import type { DeploymentSignal, TraceSignal } from "./contracts.js";

export type IncidentState = "DETECTED" | "TRIAGED" | "MITIGATING" | "RECOVERING" | "RESOLVED" | "POSTMORTEM";
export type Severity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export interface TimelineEvent { at: string; kind: "failure" | "deployment" | "signal" | "decision" | "recovery"; summary: string; source: string; }
export interface OperationalIncident { incident: Incident; severity: Severity; state: IncidentState; title: string; owner?: string; timeline: TimelineEvent[]; tags: string[]; }
export interface BlastRadius { workflows: string[]; executions: number; dependencies: string[]; deployments: string[]; environments: string[]; }
export interface RecoveryGuardrail { maxBatchSize: number; canaryPercent: number; maxErrorRatePercent: number; requiredApprovals: number; requiredRoles: string[]; }
export interface RecoveryDecision { allowed: boolean; reasons: string[]; proposedRuns: number; guardrail: RecoveryGuardrail; decisionId: string; }

export function establishIncident(incident: Incident, now = new Date().toISOString()): OperationalIncident {
  const radius = blastRadius(incident);
  const severity: Severity = radius.executions >= 1_000 ? "SEV1" : radius.executions >= 100 ? "SEV2" : radius.executions >= 10 ? "SEV3" : "SEV4";
  return { incident, severity, state: "DETECTED", title: `${incident.sharedBoundary} failure`, tags: [...radius.dependencies, ...radius.environments], timeline: [{ at: now, kind: "failure", summary: `${radius.executions} executions grouped into ${incident.id}.`, source: "deadwire" }] };
}

export function blastRadius(incident: Incident): BlastRadius {
  const unique = (values: string[]) => [...new Set(values)].sort();
  return { workflows: unique(incident.failures.map((run) => run.workflow)), executions: incident.failures.length, dependencies: unique(incident.failures.flatMap((run) => run.dependency ? [run.dependency] : [])), deployments: unique(incident.failures.map((run) => run.deployment)), environments: unique(incident.failures.map((run) => run.environment)) };
}

export function buildTimeline(incident: Incident, deployments: DeploymentSignal[], traces: TraceSignal[]): TimelineEvent[] {
  const relatedDeployments = deployments.filter((deployment) => incident.failures.some((run) => run.deployment.includes(deployment.sha)));
  const relatedTraces = traces.filter((trace) => incident.failures.some((run) => run.dependency === trace.dependency));
  return [
    ...incident.failures.map((run) => ({ at: run.failedAt, kind: "failure" as const, summary: `${run.workflow}/${run.step.name} failed: ${run.exception}`, source: run.id })),
    ...relatedDeployments.map((deployment) => ({ at: deployment.deployedAt, kind: "deployment" as const, summary: `${deployment.provider} deployed ${deployment.sha} to ${deployment.environment}.`, source: deployment.provider })),
    ...relatedTraces.filter((trace) => trace.status === "error").map((trace) => ({ at: trace.timestamp, kind: "signal" as const, summary: `${trace.service} dependency error at ${trace.dependency ?? "unknown"}.`, source: trace.traceId }))
  ].sort((a, b) => a.at.localeCompare(b.at));
}

export function decideRecovery(incident: Incident, plan: PlanItem[], guardrail: RecoveryGuardrail, approvals: Array<{ actor: string; role: string }>): RecoveryDecision {
  const reasons: string[] = [];
  const unsafe = plan.filter((item) => item.action === "BLOCK" || item.action === "MANUAL_REVIEW");
  const safe = plan.filter((item) => item.action === "SAFE_RESUME" || item.action === "SAFE_RESTART");
  if (unsafe.length) reasons.push(`${unsafe.length} execution(s) are blocked or require manual review.`);
  if (safe.length > guardrail.maxBatchSize) reasons.push(`Batch exceeds configured maximum of ${guardrail.maxBatchSize}.`);
  const roles = new Set(approvals.map((approval) => approval.role));
  if (approvals.length < guardrail.requiredApprovals) reasons.push(`Requires ${guardrail.requiredApprovals} independent approvals.`);
  for (const role of guardrail.requiredRoles) if (!roles.has(role)) reasons.push(`Missing required ${role} approval.`);
  const decisionMaterial = JSON.stringify({ incident: incident.id, safe: safe.map((item) => item.executionId), reasons, guardrail, approvals: approvals.map((approval) => approval.actor).sort() });
  return { allowed: reasons.length === 0, reasons, proposedRuns: safe.length, guardrail, decisionId: `DG-${createHash("sha256").update(decisionMaterial).digest("hex").slice(0, 12)}` };
}

export interface Runbook { id: string; title: string; appliesTo: { dependency?: string; workflow?: string; failureContains?: string }; steps: Array<{ instruction: string; required: boolean }>; }
export function matchRunbooks(incident: Incident, runbooks: Runbook[]): Runbook[] {
  return runbooks.filter((runbook) => incident.failures.some((failure) => (!runbook.appliesTo.dependency || failure.dependency === runbook.appliesTo.dependency) && (!runbook.appliesTo.workflow || failure.workflow === runbook.appliesTo.workflow) && (!runbook.appliesTo.failureContains || failure.exception.toLowerCase().includes(runbook.appliesTo.failureContains.toLowerCase()))));
}
