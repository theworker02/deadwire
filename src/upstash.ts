import type { ExecutionFailure } from "./core.js";

/** Provider boundary. Real endpoint mappings remain deliberately isolated here. */
export interface FailureSource { listFailures(): Promise<ExecutionFailure[]>; }

export class UpstashQStashSource implements FailureSource {
  constructor(private readonly token: string, private readonly baseUrl = "https://qstash.upstash.io") {}

  async listFailures(): Promise<ExecutionFailure[]> {
    const response = await fetch(`${this.baseUrl}/v2/dlq`, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!response.ok) throw new Error(`Upstash DLQ import failed (${response.status}).`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error("Unexpected Upstash DLQ response; update the adapter normalizer before importing.");
    return payload.map((entry, index) => normalizeDlqEntry(entry as Record<string, unknown>, index));
  }
}

export function normalizeDlqEntry(entry: Record<string, unknown>, index = 0): ExecutionFailure {
  // Never persist raw request bodies here. An ingestion service must sanitize them first.
  const id = string(entry.dlqId ?? entry.messageId, `upstash_${index}`);
  return {
    id, workflow: string(entry.workflowName, "unknown-workflow"), workflowVersion: string(entry.workflowVersion, "unknown"), deployment: string(entry.deployment, "unknown"), failedAt: string(entry.timestamp, new Date(0).toISOString()),
    step: { name: string(entry.stepName, "unknown-step"), status: "failed", versionHash: string(entry.stepHash, "unknown"), externalEffect: "unknown", idempotencyKeyObserved: Boolean(entry.idempotencyKey) },
    exception: string(entry.error ?? entry.errorMessage, "Unknown provider failure"), httpStatus: number(entry.status), dependency: string(entry.destination, "unknown"), environment: string(entry.environment, "unknown"), completedSteps: []
  };
}
function string(value: unknown, fallback: string): string { return typeof value === "string" && value.length > 0 ? value : fallback; }
function number(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
