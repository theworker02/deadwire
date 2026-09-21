export interface RetentionPolicy { evidenceDays: number; rawFixtureDays: number; auditDays: number; legalHoldTenants: string[]; }
export interface RetentionCandidate { tenantId: string; kind: "evidence" | "raw-fixture" | "audit"; createdAt: string; id: string; }
export function retentionCandidates(items: RetentionCandidate[], policy: RetentionPolicy, now = new Date()): RetentionCandidate[] {
  return items.filter((item) => {
    if (policy.legalHoldTenants.includes(item.tenantId)) return false;
    const days = item.kind === "evidence" ? policy.evidenceDays : item.kind === "raw-fixture" ? policy.rawFixtureDays : policy.auditDays;
    return now.getTime() - new Date(item.createdAt).getTime() >= days * 86_400_000;
  });
}
