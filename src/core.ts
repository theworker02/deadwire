import { createHash } from "node:crypto";

export type Risk = "SAFE" | "UNSAFE" | "UNKNOWN";
export type RecoveryAction = "SAFE_RESUME" | "SAFE_RESTART" | "MANUAL_REVIEW" | "BLOCK";

export interface StepEvidence {
  name: string;
  status: "succeeded" | "failed";
  versionHash: string;
  externalEffect?: "none" | "confirmed" | "unknown";
  idempotencyKeyObserved?: boolean;
  deterministic?: boolean;
  destinationIdempotent?: boolean;
}

export interface ExecutionFailure {
  id: string;
  workflow: string;
  workflowVersion: string;
  deployment: string;
  failedAt: string;
  step: StepEvidence;
  exception: string;
  httpStatus?: number;
  dependency?: string;
  requestShape?: string;
  responseShape?: string;
  environment: string;
  completedSteps: StepEvidence[];
  sanitizedState?: Record<string, unknown>;
}

export interface Incident {
  id: string;
  signature: string;
  failures: ExecutionFailure[];
  firstObserved: string;
  sharedBoundary: string;
  confidence: number;
}

export interface RetryAnalysis { risk: Risk; reason: string; evidence: string[]; }
export interface Compatibility { safe: boolean; reason: string; changedCompletedSteps: string[]; }
export interface PlanItem { executionId: string; action: RecoveryAction; reason: string; retry: RetryAnalysis; compatibility: Compatibility; }

export function fingerprint(failure: ExecutionFailure): string {
  const material = [failure.step.name, failure.deployment, failure.dependency ?? "", String(failure.httpStatus ?? ""), normalize(failure.exception), failure.requestShape ?? "", failure.responseShape ?? "", failure.environment].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

function normalize(value: string): string { return value.replace(/[0-9a-f]{8,}/gi, "#").replace(/\d+/g, "#").toLowerCase(); }

export function clusterFailures(failures: ExecutionFailure[]): Incident[] {
  const groups = new Map<string, ExecutionFailure[]>();
  for (const failure of failures) {
    const key = fingerprint(failure);
    groups.set(key, [...(groups.get(key) ?? []), failure]);
  }
  return [...groups.entries()].map(([signature, runs], index) => {
    const boundaries = runs.map((run) => `${run.step.name}${run.dependency ? ` → ${run.dependency}` : ""}`);
    const sharedBoundary = mostCommon(boundaries);
    return { id: `DW-${193 + index}`, signature, failures: runs, firstObserved: runs.map((run) => run.failedAt).sort()[0], sharedBoundary, confidence: Math.round((runs.filter((run) => `${run.step.name}${run.dependency ? ` → ${run.dependency}` : ""}` === sharedBoundary).length / runs.length) * 1000) / 10 };
  }).sort((a, b) => b.failures.length - a.failures.length);
}

function mostCommon(values: string[]): string { return [...new Set(values)].sort((a, b) => values.filter((v) => v === b).length - values.filter((v) => v === a).length)[0] ?? "unknown"; }

export function analyzeRetry(step: StepEvidence): RetryAnalysis {
  if (step.externalEffect === "unknown") return { risk: "UNSAFE", reason: "Previous attempt may have reached an external provider with an unknown outcome.", evidence: ["external side effect: unknown", `idempotency key: ${step.idempotencyKeyObserved ? "observed" : "not observed"}`] };
  if (step.externalEffect === "confirmed" && !step.idempotencyKeyObserved) return { risk: "UNSAFE", reason: "A confirmed external side effect has no observed idempotency key.", evidence: ["external side effect: confirmed", "idempotency key: not observed"] };
  if (step.deterministic && step.destinationIdempotent && step.externalEffect !== "confirmed") return { risk: "SAFE", reason: "Deterministic work targets an idempotent destination and no effect was confirmed.", evidence: ["deterministic input", "idempotent destination", "external effect absent"] };
  return { risk: "UNKNOWN", reason: "Insufficient evidence to prove replay is safe.", evidence: ["side-effect evidence incomplete"] };
}

export function compareWorkflowVersion(failure: ExecutionFailure, candidateStepHashes: Record<string, string>): Compatibility {
  const changed = failure.completedSteps.filter((step) => candidateStepHashes[step.name] !== undefined && candidateStepHashes[step.name] !== step.versionHash).map((step) => step.name);
  return changed.length === 0 ? { safe: true, reason: "Previously completed step hashes are compatible with the candidate workflow.", changedCompletedSteps: [] } : { safe: false, reason: "Code changed before the recovery boundary.", changedCompletedSteps: changed };
}

export function makePlan(incident: Incident, candidateStepHashes: Record<string, string>): PlanItem[] {
  return incident.failures.map((failure) => {
    const retry = analyzeRetry(failure.step);
    const compatibility = compareWorkflowVersion(failure, candidateStepHashes);
    let action: RecoveryAction = "MANUAL_REVIEW";
    let reason = "Recovery needs an operator decision.";
    if (retry.risk === "UNSAFE") { action = "BLOCK"; reason = "Potential duplicate external side effect; verify the provider state first."; }
    else if (!compatibility.safe) { action = "MANUAL_REVIEW"; reason = "Resume could execute against incompatible prior state."; }
    else if (retry.risk === "SAFE") { action = "SAFE_RESUME"; reason = "Replay evidence and version compatibility support a resume."; }
    return { executionId: failure.id, action, reason, retry, compatibility };
  });
}

export interface SimulationResult { executionId: string; passed: boolean; reason: string; duplicateRisk: Risk; }
export function simulate(incident: Incident, candidateStepHashes: Record<string, string>): SimulationResult[] {
  return incident.failures.map((failure) => {
    const retry = analyzeRetry(failure.step);
    const compatible = compareWorkflowVersion(failure, candidateStepHashes);
    const passed = retry.risk === "SAFE" && compatible.safe && Boolean(failure.sanitizedState);
    return { executionId: failure.id, passed, duplicateRisk: retry.risk, reason: passed ? "Sanitized replay fixture passed deterministic checks." : retry.risk !== "SAFE" ? retry.reason : compatible.reason };
  });
}
