import { createHash } from "node:crypto";
import type { Incident, PlanItem, RecoveryAction } from "./core.js";

export type ReceiptStatus = "PROPOSED" | "APPROVED" | "REJECTED";
export interface RecoveryReceipt { id: string; incidentId: string; createdAt: string; proposedBy: string; status: ReceiptStatus; planHash: string; actions: Partial<Record<RecoveryAction, number>>; evidence: string[]; approvedBy?: string; approvedAt?: string; }

export function createRecoveryReceipt(incident: Incident, plan: PlanItem[], proposedBy: string, now = new Date().toISOString()): RecoveryReceipt {
  const blocked = plan.filter((item) => item.action === "BLOCK" || item.action === "MANUAL_REVIEW");
  if (blocked.length > 0) throw new RecoveryGateError(`Recovery proposal denied: ${blocked.length} execution(s) require review or are blocked.`);
  const actions = plan.reduce<Record<string, number>>((summary, item) => ({ ...summary, [item.action]: (summary[item.action] ?? 0) + 1 }), {});
  const evidence = [...new Set(plan.flatMap((item) => [...item.retry.evidence, item.compatibility.reason]))];
  const planHash = hash(JSON.stringify(plan.map((item) => ({ id: item.executionId, action: item.action }))));
  return { id: `RC-${planHash.slice(0, 10)}`, incidentId: incident.id, createdAt: now, proposedBy, status: "PROPOSED", planHash, actions, evidence };
}

export function approveReceipt(receipt: RecoveryReceipt, approver: string, now = new Date().toISOString()): RecoveryReceipt {
  if (receipt.status !== "PROPOSED") throw new RecoveryGateError(`Receipt ${receipt.id} is ${receipt.status.toLowerCase()} and cannot be approved.`);
  if (!approver.trim()) throw new RecoveryGateError("An approving operator is required.");
  return { ...receipt, status: "APPROVED", approvedBy: approver, approvedAt: now };
}

export class RecoveryGateError extends Error { }
function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
