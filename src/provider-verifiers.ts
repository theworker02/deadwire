import type { SideEffectVerification, SideEffectVerifier } from "./contracts.js";

export interface PaymentLedger { findByTransactionHash(hash: string): Promise<{ status: "succeeded" | "absent" | "unknown"; reference: string }>; }
export class PaymentTransactionVerifier implements SideEffectVerifier {
  readonly kind = "payment" as const;
  constructor(private readonly ledger: PaymentLedger) {}
  async verify(input: { providerTransactionIdHash?: string }): Promise<SideEffectVerification> {
    if (!input.providerTransactionIdHash) return unknown("No provider transaction reference was recorded.");
    const result = await this.ledger.findByTransactionHash(input.providerTransactionIdHash);
    return { outcome: result.status === "succeeded" ? "confirmed" : result.status, evidence: `Payment ledger reference: ${result.reference}`, checkedAt: new Date().toISOString() };
  }
}

export interface DeliveryLedger { findByIdempotencyHash(hash: string): Promise<{ delivered: boolean | "unknown"; reference: string }>; }
export class EmailOrWebhookVerifier implements SideEffectVerifier {
  constructor(readonly kind: "email" | "webhook", private readonly ledger: DeliveryLedger) {}
  async verify(input: { idempotencyKeyHash?: string }): Promise<SideEffectVerification> {
    if (!input.idempotencyKeyHash) return unknown("No idempotency key was recorded for delivery verification.");
    const result = await this.ledger.findByIdempotencyHash(input.idempotencyKeyHash);
    return { outcome: result.delivered === "unknown" ? "unknown" : result.delivered ? "confirmed" : "absent", evidence: `Delivery ledger reference: ${result.reference}`, checkedAt: new Date().toISOString() };
  }
}

export interface OutboxStore { findByIdempotencyHash(hash: string): Promise<{ committed: boolean | "unknown"; reference: string }>; }
export class DatabaseOutboxVerifier implements SideEffectVerifier {
  readonly kind = "database-write" as const;
  constructor(private readonly outbox: OutboxStore) {}
  async verify(input: { idempotencyKeyHash?: string }): Promise<SideEffectVerification> {
    if (!input.idempotencyKeyHash) return unknown("No idempotency key was recorded for outbox verification.");
    const result = await this.outbox.findByIdempotencyHash(input.idempotencyKeyHash);
    return { outcome: result.committed === "unknown" ? "unknown" : result.committed ? "confirmed" : "absent", evidence: `Outbox reference: ${result.reference}`, checkedAt: new Date().toISOString() };
  }
}

export interface ObjectInspector { findByOutputHash(hash: string): Promise<{ exists: boolean | "unknown"; reference: string }>; }
export class ObjectOutputVerifier implements SideEffectVerifier {
  readonly kind = "object-write" as const;
  constructor(private readonly objects: ObjectInspector) {}
  async verify(input: { outputHash?: string }): Promise<SideEffectVerification> {
    if (!input.outputHash) return unknown("No expected object-output hash was recorded.");
    const result = await this.objects.findByOutputHash(input.outputHash);
    return { outcome: result.exists === "unknown" ? "unknown" : result.exists ? "confirmed" : "absent", evidence: `Object store reference: ${result.reference}`, checkedAt: new Date().toISOString() };
  }
}
function unknown(evidence: string): SideEffectVerification { return { outcome: "unknown", evidence, checkedAt: new Date().toISOString() }; }
