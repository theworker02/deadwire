import { createHash, createHmac } from "node:crypto";
import type { SideEffectKind, StepManifest, WorkflowEvidence, WorkflowProvenance } from "./contracts.js";

export interface EvidenceEmitter { emit(evidence: WorkflowEvidence): Promise<void>; }
export interface DeadwireStepOptions { sideEffect?: SideEffectKind; idempotencyKey?: string; providerTransactionId?: string; request?: unknown; }

/**
 * An SDK-facing recorder. It intentionally wraps callbacks rather than relying on
 * monkey-patching Upstash internals, so normal `context.run` / `context.call`
 * ownership and semantics stay intact.
 */
export class WorkflowRecorder {
  private readonly steps: StepManifest[] = [];
  constructor(private readonly tenantId: string, private readonly runId: string, private readonly provenance: WorkflowProvenance, private readonly emitter: EvidenceEmitter) {}
  async run<T>(step: string, source: Function, fn: () => Promise<T>, options: DeadwireStepOptions = {}): Promise<T> {
    const ordinal = this.steps.length;
    const stepHash = stableHash(source.toString());
    try {
      const output = await fn();
      this.steps.push({ step, stepHash, ordinal, completed: true, sideEffect: options.sideEffect ?? "none", idempotencyKeyHash: hashOptional(options.idempotencyKey), providerTransactionIdHash: hashOptional(options.providerTransactionId), requestShapeHash: shapeHash(options.request), responseShapeHash: shapeHash(output) });
      return output;
    } catch (error) {
      this.steps.push({ step, stepHash, ordinal, completed: false, sideEffect: options.sideEffect ?? "none", idempotencyKeyHash: hashOptional(options.idempotencyKey), providerTransactionIdHash: hashOptional(options.providerTransactionId), requestShapeHash: shapeHash(options.request) });
      throw error;
    }
  }
  evidence(): WorkflowEvidence { return { tenantId: this.tenantId, runId: this.runId, provenance: this.provenance, steps: this.steps, emittedAt: new Date().toISOString() }; }
  flush(): Promise<void> { return this.emitter.emit(this.evidence()); }
}

export class HttpEvidenceEmitter implements EvidenceEmitter {
  constructor(private readonly endpoint: string, private readonly token: string) {}
  async emit(evidence: WorkflowEvidence): Promise<void> {
    const response = await fetch(this.endpoint, { headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" }, method: "POST", body: JSON.stringify(evidence) } as any);
    if (!response.ok) throw new Error(`Deadwire evidence delivery failed (${response.status}).`);
  }
}
/** Emits the same exact-body HMAC verified by Deadwire's evidence webhook. */
export class HmacEvidenceEmitter implements EvidenceEmitter {
  constructor(private readonly endpoint: string, private readonly secret: string) {}
  async emit(evidence: WorkflowEvidence): Promise<void> {
    const body = JSON.stringify(evidence);
    const signature = createHmac("sha256", this.secret).update(body).digest("hex");
    const response = await fetch(this.endpoint, { headers: { "content-type": "application/json", "x-deadwire-signature": `sha256=${signature}` }, method: "POST", body } as any);
    if (!response.ok) throw new Error(`Deadwire evidence delivery failed (${response.status}).`);
  }
}
function stableHash(value: string): string { return createHash("sha256").update(value.replace(/\s+/g, " ")).digest("hex"); }
function hashOptional(value: string | undefined): string | undefined { return value ? stableHash(value) : undefined; }
function shapeHash(value: unknown): string | undefined { if (value === undefined) return undefined; return stableHash(JSON.stringify(shape(value))); }
function shape(value: unknown): unknown { if (Array.isArray(value)) return value.map(shape); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, typeof child === "object" && child !== null ? shape(child) : typeof child])); return typeof value; }
