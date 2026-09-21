import type { RecoveryReceipt } from "./recovery.js";

export interface FlowControl { key: string; parallelism: number; rate: number; period: string; retries: number; }
export interface RecoveryMapping { dlqId: string; workflowRunId: string; workflowCreatedAt: number; }
export interface RecoveryBatch { id: string; receiptId: string; incidentId: string; dlqIds: string[]; flowControl: FlowControl; canarySize: number; state: "PROPOSED" | "CANARY" | "OBSERVING" | "RAMPING" | "HALTED" | "RECONCILED"; mappings: RecoveryMapping[]; createdAt: string; }
export class RecoveryControlError extends Error { }

/** Real QStash REST client; it can only act on an approved receipt. */
export class UpstashRecoveryControl {
  constructor(private readonly token: string, private readonly baseUrl = "https://qstash.upstash.io") {}
  async resume(batch: RecoveryBatch, receipt: RecoveryReceipt, dlqIds: string[]): Promise<RecoveryMapping[]> {
    if (receipt.status !== "APPROVED") throw new RecoveryControlError("An approved recovery receipt is required.");
    if (batch.state !== "CANARY" && batch.state !== "RAMPING") throw new RecoveryControlError(`Recovery batch ${batch.id} is not authorized to resume in state ${batch.state}.`);
    if (dlqIds.length === 0) return [];
    const response = await fetch(`${this.baseUrl}/v2/workflows/dlq/resume/${dlqIds.join(",")}`, { method: "POST", headers: { authorization: `Bearer ${this.token}`, "Upstash-Retries": String(batch.flowControl.retries), "Upstash-Flow-Control-Key": batch.flowControl.key, "Upstash-Flow-Control-Value": `parallelism=${batch.flowControl.parallelism},rate=${batch.flowControl.rate},period=${batch.flowControl.period}` } } as any);
    if (!response.ok) throw new RecoveryControlError(`Upstash resume failed (${response.status}): ${await response.text()}`);
    const payload = await response.json() as { workflowRuns?: Array<{ workflowRunId: string; workflowCreatedAt: number }> };
    return (payload.workflowRuns ?? []).map((run, index) => ({ dlqId: dlqIds[index] ?? "unknown", ...run }));
  }
}

export function proposeBatch(receipt: RecoveryReceipt, dlqIds: string[], flowControl: FlowControl, canaryPercent = 1): RecoveryBatch {
  if (receipt.status !== "APPROVED") throw new RecoveryControlError("Approve the recovery receipt before proposing a batch.");
  if (!flowControl.key || flowControl.parallelism < 1 || flowControl.rate < 1 || flowControl.retries < 0) throw new RecoveryControlError("Recovery flow control must specify a positive key, parallelism, rate, and non-negative retries.");
  return { id: `RB-${receipt.id.slice(3)}`, receiptId: receipt.id, incidentId: receipt.incidentId, dlqIds, flowControl, canarySize: Math.max(1, Math.ceil(dlqIds.length * (canaryPercent / 100))), state: "PROPOSED", mappings: [], createdAt: new Date().toISOString() };
}

export function beginCanary(batch: RecoveryBatch): RecoveryBatch { if (batch.state !== "PROPOSED") throw new RecoveryControlError("Only proposed batches can enter canary."); return { ...batch, state: "CANARY" }; }
export function observeCanary(batch: RecoveryBatch, recurrenceDetected: boolean): RecoveryBatch { if (batch.state !== "CANARY") throw new RecoveryControlError("Only a canary can be observed."); return { ...batch, state: recurrenceDetected ? "HALTED" : "OBSERVING" }; }
export function rampBatch(batch: RecoveryBatch): RecoveryBatch { if (batch.state !== "OBSERVING") throw new RecoveryControlError("Only a clean observed canary can ramp."); return { ...batch, state: "RAMPING" }; }
export function reconcileBatch(batch: RecoveryBatch, mappings: RecoveryMapping[]): RecoveryBatch { if (batch.state !== "RAMPING" && batch.state !== "OBSERVING") throw new RecoveryControlError("Only active batches can reconcile."); return { ...batch, state: "RECONCILED", mappings }; }
