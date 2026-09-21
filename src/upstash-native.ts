import type { ExecutionFailure } from "./core.js";
import type { WorkflowEvidence, WorkflowProvenance } from "./contracts.js";
import { WorkflowRecorder, type DeadwireStepOptions, type EvidenceEmitter } from "./sdk.js";
import type { FlowControl } from "./upstash-control.js";

export interface UpstashDlqPage { messages: Array<Record<string, unknown>>; cursor?: string; }
export interface UpstashClientOptions { token: string; baseUrl?: string; }
export interface UpstashResumePreview { dlqIds: string[]; endpoint: string; method: "POST"; headers: Record<string, string>; requiresApprovedReceipt: true; }

/**
 * Small, public-API-shaped adapter. It treats QStash as the execution authority
 * and only prepares normalized evidence and recovery intent for Deadwire.
 */
export class UpstashWorkflowAdapter {
  private readonly baseUrl: string;
  constructor(private readonly options: UpstashClientOptions) { this.baseUrl = options.baseUrl ?? "https://qstash.upstash.io"; }
  async listDlq(cursor?: string): Promise<UpstashDlqPage> {
    const url = new URL("/v2/dlq", this.baseUrl); if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url.toString(), { headers: { authorization: `Bearer ${this.options.token}` } });
    if (!response.ok) throw new Error(`Upstash DLQ list failed (${response.status}).`);
    const payload = await response.json() as { messages?: Array<Record<string, unknown>>; cursor?: string } | Array<Record<string, unknown>>;
    return Array.isArray(payload) ? { messages: payload } : { messages: payload.messages ?? [], cursor: payload.cursor };
  }
  async getDlq(dlqId: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/v2/dlq/${encodeURIComponent(dlqId)}`, { headers: { authorization: `Bearer ${this.options.token}` } });
    if (!response.ok) throw new Error(`Upstash DLQ read failed (${response.status}).`);
    return await response.json() as Record<string, unknown>;
  }
  previewResume(dlqIds: string[], flow: FlowControl): UpstashResumePreview {
    if (!dlqIds.length) throw new Error("At least one DLQ ID is required.");
    validateFlowControl(flow);
    return { dlqIds, endpoint: `${this.baseUrl}/v2/workflows/dlq/resume/${dlqIds.map(encodeURIComponent).join(",")}`, method: "POST", headers: { "Upstash-Retries": String(flow.retries), "Upstash-Flow-Control-Key": flow.key, "Upstash-Flow-Control-Value": `parallelism=${flow.parallelism},rate=${flow.rate},period=${flow.period}` }, requiresApprovedReceipt: true };
  }
}

export function normalizeUpstashDlq(message: Record<string, unknown>): ExecutionFailure {
  const headers = record(message.responseHeader ?? message.header);
  const failureText = string(message.responseBody ?? message.error ?? message.errorMessage, "Upstash DLQ failure without a response body.");
  return {
    id: string(message.dlqId ?? message.messageId, "unknown-dlq-entry"), workflow: string(message.workflowName ?? headers["upstash-workflow-name"], "unknown-workflow"), workflowVersion: string(message.workflowVersion ?? headers["upstash-workflow-version"], "unknown"), deployment: string(headers["x-deadwire-deployment"] ?? message.deployment, "unknown"), failedAt: iso(message.createdAt ?? message.timestamp),
    step: { name: string(headers["upstash-workflow-step"] ?? message.stepName, "unknown-step"), status: "failed", versionHash: string(headers["x-deadwire-step-hash"] ?? message.stepHash, "unknown"), externalEffect: "unknown", idempotencyKeyObserved: Boolean(headers["idempotency-key"] ?? message.idempotencyKey) },
    exception: failureText, httpStatus: numeric(message.responseStatus ?? message.status), dependency: string(message.url ?? message.destination, "unknown"), requestShape: string(headers["x-deadwire-request-shape"], undefined), responseShape: string(headers["x-deadwire-response-shape"], undefined), environment: string(headers["x-deadwire-environment"] ?? message.environment, "unknown"), completedSteps: []
  };
}

/** Framework-agnostic bridge for `context.run` and agent tool callbacks. */
export class UpstashEvidenceBridge {
  private readonly recorder: WorkflowRecorder;
  constructor(tenantId: string, workflowRunId: string, provenance: WorkflowProvenance, emitter: EvidenceEmitter) { this.recorder = new WorkflowRecorder(tenantId, workflowRunId, provenance, emitter); }
  async run<T>(name: string, source: Function, callback: () => Promise<T>, options?: DeadwireStepOptions): Promise<T> { return this.recorder.run(name, source, callback, options); }
  async tool<T>(agent: string, tool: string, source: Function, callback: () => Promise<T>, options: DeadwireStepOptions = {}): Promise<T> { return this.recorder.run(`agent:${agent}/tool:${tool}`, source, callback, options); }
  evidence(): WorkflowEvidence { return this.recorder.evidence(); }
  flush(): Promise<void> { return this.recorder.flush(); }
}

export interface UpstashDoctorReport { ready: boolean; checks: Array<{ name: string; status: "pass" | "warn" | "fail"; detail: string }>; }
export function upstashDoctor(environment: Record<string, string | undefined>): UpstashDoctorReport {
  const checks: UpstashDoctorReport["checks"] = [
    { name: "QStash token", status: environment.UPSTASH_QSTASH_TOKEN ? "pass" : "warn", detail: environment.UPSTASH_QSTASH_TOKEN ? "Server-side token configured." : "Set UPSTASH_QSTASH_TOKEN only in the trusted recovery worker." },
    { name: "Evidence secret", status: environment.DEADWIRE_INGEST_SECRET ? "pass" : "fail", detail: environment.DEADWIRE_INGEST_SECRET ? "Evidence webhook HMAC secret configured." : "Set DEADWIRE_INGEST_SECRET before accepting SDK evidence." },
    { name: "Deployment provenance", status: environment.GIT_SHA ? "pass" : "warn", detail: environment.GIT_SHA ? "Deployment SHA is available to workflow instrumentation." : "Set GIT_SHA in CI to enable compatibility provenance." },
    { name: "Production persistence", status: environment.DATABASE_URL ? "pass" : "warn", detail: environment.DATABASE_URL ? "A database URL is configured; wire it to a tenant-aware repository." : "Local JSON evidence storage is development-only." }
  ];
  return { ready: !checks.some((check) => check.status === "fail"), checks };
}
function validateFlowControl(flow: FlowControl): void { if (!flow.key || flow.parallelism < 1 || flow.rate < 1 || flow.retries < 0 || !flow.period) throw new Error("Invalid Upstash recovery flow-control configuration."); }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function string(value: unknown, fallback: string | undefined): string { return typeof value === "string" && value.length > 0 ? value : fallback ?? "unknown"; }
function numeric(value: unknown): number | undefined { return typeof value === "number" ? value : undefined; }
function iso(value: unknown): string { if (typeof value === "number") return new Date(value).toISOString(); return typeof value === "string" ? value : new Date().toISOString(); }
