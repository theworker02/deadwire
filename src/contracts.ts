/** Provider-neutral contracts. Implementations must not expose raw customer payloads. */
export type SideEffectKind = "payment" | "email" | "webhook" | "database-write" | "provisioning" | "object-write" | "none";
export type SideEffectOutcome = "absent" | "confirmed" | "unknown" | "idempotent";

export interface WorkflowProvenance { workflow: string; workflowVersion: string; deploymentSha: string; environment: string; sourceCommit?: string; traceId?: string; spanId?: string; }
export interface StepManifest { step: string; stepHash: string; ordinal: number; completed: boolean; sideEffect: SideEffectKind; idempotencyKeyHash?: string; providerTransactionIdHash?: string; requestShapeHash?: string; responseShapeHash?: string; }
export interface WorkflowEvidence { tenantId: string; runId: string; provenance: WorkflowProvenance; steps: StepManifest[]; emittedAt: string; }

export interface TraceSignal { tenantId: string; traceId: string; spanId: string; service: string; dependency?: string; status: "ok" | "error"; timestamp: string; durationMs?: number; deploymentSha?: string; attributes: Record<string, string | number | boolean>; }
export interface DeploymentSignal { tenantId: string; provider: "github" | "vercel" | "ci"; sha: string; deployedAt: string; environment: string; changedFiles: string[]; changedPackages: string[]; }

export interface SideEffectVerification { outcome: SideEffectOutcome; evidence: string; checkedAt: string; }
export interface SideEffectVerifier { kind: SideEffectKind; verify(input: { idempotencyKeyHash?: string; providerTransactionIdHash?: string; outputHash?: string }): Promise<SideEffectVerification>; }
