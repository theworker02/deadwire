import { createHmac, timingSafeEqual } from "node:crypto";
import type { WorkflowEvidence } from "./contracts.js";

export class WebhookVerificationError extends Error { }
export function verifyHmacSignature(rawBody: string, signature: string | undefined, secret: string): void {
  if (!signature) throw new WebhookVerificationError("Missing webhook signature.");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const incoming = signature.replace(/^sha256=/, "");
  const left = new TextEncoder().encode(expected); const right = new TextEncoder().encode(incoming);
  if (left.byteLength !== right.byteLength || !timingSafeEqual(left, right)) throw new WebhookVerificationError("Invalid webhook signature.");
}

export function validateWorkflowEvidence(input: unknown): WorkflowEvidence {
  if (!input || typeof input !== "object") throw new WebhookVerificationError("Evidence must be an object.");
  const evidence = input as Partial<WorkflowEvidence>;
  if (!nonEmpty(evidence.tenantId) || !nonEmpty(evidence.runId) || !evidence.provenance || !Array.isArray(evidence.steps) || !nonEmpty(evidence.emittedAt)) throw new WebhookVerificationError("Evidence is missing required fields.");
  if (evidence.steps.some((step) => !nonEmpty(step.step) || !nonEmpty(step.stepHash) || typeof step.completed !== "boolean")) throw new WebhookVerificationError("Evidence contains an invalid step manifest.");
  return evidence as WorkflowEvidence;
}
function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
