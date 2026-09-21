import type { DeploymentSignal, TraceSignal, WorkflowEvidence } from "./contracts.js";

export interface CompatibilityReport { safe: boolean; deploymentSha: string; changedBeforeFailure: string[]; changedPackages: string[]; reason: string; }
/** Conservative source-aware gate. A changed completed step always blocks automatic resume. */
export function analyzeDeploymentCompatibility(evidence: WorkflowEvidence, deployment: DeploymentSignal, changedStepFiles: Record<string, string>): CompatibilityReport {
  const completed = evidence.steps.filter((step) => step.completed);
  const changedBeforeFailure = completed.filter((step) => deployment.changedFiles.includes(changedStepFiles[step.step] ?? "")).map((step) => step.step);
  const safe = changedBeforeFailure.length === 0;
  return { safe, deploymentSha: deployment.sha, changedBeforeFailure, changedPackages: deployment.changedPackages, reason: safe ? "No recorded completed step source file changed in the candidate deployment." : "Candidate deployment changed code that produced already-persisted workflow state." };
}

export interface CorrelatedBoundary { dependency: string; deploymentSha?: string; traces: number; errorRate: number; }
export function correlateTraces(signals: TraceSignal[]): CorrelatedBoundary[] {
  const groups = new Map<string, TraceSignal[]>();
  for (const signal of signals.filter((item) => item.dependency)) groups.set(`${signal.dependency}:${signal.deploymentSha ?? "unknown"}`, [...(groups.get(`${signal.dependency}:${signal.deploymentSha ?? "unknown"}`) ?? []), signal]);
  return [...groups.entries()].map(([key, items]) => { const [dependency, deploymentSha] = key.split(":"); return { dependency, deploymentSha: deploymentSha === "unknown" ? undefined : deploymentSha, traces: items.length, errorRate: Math.round((items.filter((item) => item.status === "error").length / items.length) * 1000) / 10 }; }).sort((a, b) => b.errorRate - a.errorRate || b.traces - a.traces);
}

export interface AgentCost { runId: string; agent: string; model: string; inputTokens: number; outputTokens: number; estimatedUsd: number; }
export function summarizeAgentCost(costs: AgentCost[]): { totalUsd: number; inputTokens: number; outputTokens: number; byAgent: Record<string, number> } {
  return costs.reduce((summary, cost) => ({ totalUsd: Math.round((summary.totalUsd + cost.estimatedUsd) * 1e6) / 1e6, inputTokens: summary.inputTokens + cost.inputTokens, outputTokens: summary.outputTokens + cost.outputTokens, byAgent: { ...summary.byAgent, [cost.agent]: Math.round(((summary.byAgent[cost.agent] ?? 0) + cost.estimatedUsd) * 1e6) / 1e6 } }), { totalUsd: 0, inputTokens: 0, outputTokens: 0, byAgent: {} as Record<string, number> });
}
