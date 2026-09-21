// Illustrative integration. Keep this in a trusted server route; do not expose
// Upstash or Deadwire secrets to the browser.
import { HmacEvidenceEmitter, UpstashEvidenceBridge } from "deadwire";

export async function checkoutWorkflow(context: { workflowRunId: string; run(name: string, fn: () => Promise<unknown>): Promise<unknown> }) {
  const bridge = new UpstashEvidenceBridge(
    "tenant_acme",
    context.workflowRunId,
    { workflow: "checkout", workflowVersion: "v18", deploymentSha: process.env.GIT_SHA!, environment: "production" },
    new HmacEvidenceEmitter(process.env.DEADWIRE_EVIDENCE_URL!, process.env.DEADWIRE_INGEST_SECRET!),
  );
  await bridge.run("validate-cart", validateCart, () => context.run("validate-cart", validateCart));
  await bridge.run("charge-customer", chargeCustomer, () => context.run("charge-customer", chargeCustomer), { sideEffect: "payment", idempotencyKey: "owned-by-application", request: { shape: "sanitized" } });
  await bridge.flush();
}
async function validateCart(): Promise<void> { /* application workflow code */ }
async function chargeCustomer(): Promise<void> { /* application workflow code */ }
