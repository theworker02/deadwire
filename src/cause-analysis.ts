import type { ExecutionFailure, Incident } from "./core.js";

export interface CauseHypothesis { id: string; class: "DEPENDENCY_CONTRACT_CHANGE" | "DEPLOYMENT_REGRESSION" | "PROVIDER_OUTAGE" | "CONFIGURATION_DRIFT" | "UNKNOWN"; confidence: number; evidence: string[]; recommendedNextStep: string; }
export function hypothesizeCause(incident: Incident): CauseHypothesis {
  const failures = incident.failures; const status = failures.map((failure) => failure.httpStatus).filter((value): value is number => value !== undefined);
  const hasShapeDrift = failures.some((failure) => Boolean(failure.requestShape && failure.responseShape));
  const deploymentCount = new Set(failures.map((failure) => failure.deployment)).size;
  if (hasShapeDrift && status.some((code) => code >= 400 && code < 500)) return { id: `CAUSE-${incident.signature.slice(0, 8)}`, class: "DEPENDENCY_CONTRACT_CHANGE", confidence: 0.88, evidence: ["request and response shape fingerprints are present", "consistent client-error status", `shared boundary: ${incident.sharedBoundary}`], recommendedNextStep: "Compare provider schema and deploy a backward-compatible boundary fix before resuming." };
  if (deploymentCount === 1) return { id: `CAUSE-${incident.signature.slice(0, 8)}`, class: "DEPLOYMENT_REGRESSION", confidence: 0.67, evidence: [`single shared deployment: ${failures[0]?.deployment ?? "unknown"}`, `shared boundary: ${incident.sharedBoundary}`], recommendedNextStep: "Compare the implicated deployment with its prior revision and review completed workflow boundaries." };
  if (status.filter((code) => code >= 500).length / Math.max(1, status.length) > 0.7) return { id: `CAUSE-${incident.signature.slice(0, 8)}`, class: "PROVIDER_OUTAGE", confidence: 0.62, evidence: ["majority of failures are server errors", `shared boundary: ${incident.sharedBoundary}`], recommendedNextStep: "Check provider status and wait for recovery before scheduling a low-rate canary." };
  return { id: `CAUSE-${incident.signature.slice(0, 8)}`, class: "UNKNOWN", confidence: 0.2, evidence: ["evidence is insufficient for a reliable causal class"], recommendedNextStep: "Collect deployment, trace, and side-effect verification evidence before recovery." };
}

export function findCorrelatedExecutions(failures: ExecutionFailure[], dependency: string): ExecutionFailure[] { return failures.filter((failure) => failure.dependency === dependency); }
