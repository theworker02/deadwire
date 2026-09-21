import type { ExecutionFailure } from "./core.js";

export const failures: ExecutionFailure[] = Array.from({ length: 12 }, (_, index) => ({
  id: `dlq_${8219 + index}`,
  workflow: index < 10 ? "checkout" : "thumbnail-pipeline",
  workflowVersion: "v17",
  deployment: index < 10 ? "checkout-api@4f18c9" : "media-api@a11c90",
  failedAt: `2026-09-21T14:${String(3 + index).padStart(2, "0")}:12Z`,
  step: index < 10 ? { name: "checkout.finalize", status: "failed", versionHash: "step-finalize-v17", externalEffect: index === 9 ? "unknown" : "none", idempotencyKeyObserved: false, deterministic: index !== 9, destinationIdempotent: false } : { name: "generate-thumbnail", status: "failed", versionHash: "thumbnail-v1", externalEffect: "none", deterministic: true, destinationIdempotent: true },
  exception: index < 10 ? "Provider response missing customer_id" : "Object store gateway timeout",
  httpStatus: index < 10 ? 422 : 504,
  dependency: index < 10 ? "payments-api/v3" : "object-store",
  requestShape: index < 10 ? "checkout:v2" : "image:v1",
  responseShape: index < 10 ? "customerId" : "timeout",
  environment: "production",
  completedSteps: [{ name: "checkout.validate", status: "succeeded", versionHash: "validate-v17" }],
  sanitizedState: { checkoutId: `chk_${index}`, customer: "redacted" }
}));

export const candidateStepHashes = { "checkout.validate": "validate-v17", "checkout.finalize": "step-finalize-v18", "generate-thumbnail": "thumbnail-v1" };
