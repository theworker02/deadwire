import test from "node:test";
import assert from "node:assert/strict";
import { EmailOrWebhookVerifier, PaymentTransactionVerifier } from "./provider-verifiers.js";

test("payment and delivery verifiers preserve an unknown outcome when evidence is absent", async () => {
  const payment = new PaymentTransactionVerifier({ findByTransactionHash: async () => ({ status: "succeeded", reference: "pi_123" }) });
  const email = new EmailOrWebhookVerifier("email", { findByIdempotencyHash: async () => ({ delivered: "unknown", reference: "delivery_123" }) });
  assert.equal((await payment.verify({ providerTransactionIdHash: "hash" })).outcome, "confirmed");
  assert.equal((await email.verify({ idempotencyKeyHash: "hash" })).outcome, "unknown");
});
