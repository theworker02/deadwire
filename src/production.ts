import type { WorkflowEvidence } from "./contracts.js";

export type Role = "viewer" | "responder" | "approver" | "admin";
export interface Actor { id: string; tenantId: string; roles: Role[]; }
export interface AuditEvent { tenantId: string; actorId: string; action: string; target: string; occurredAt: string; metadata: Record<string, string>; }
export interface TenantEvidenceRepository { saveEvidence(evidence: WorkflowEvidence): Promise<void>; evidenceForRun(tenantId: string, runId: string): Promise<WorkflowEvidence | undefined>; appendAudit(event: AuditEvent): Promise<void>; }
export class AuthorizationError extends Error { }
export function authorize(actor: Actor, tenantId: string, required: Role): void { if (actor.tenantId !== tenantId || (!actor.roles.includes(required) && !actor.roles.includes("admin"))) throw new AuthorizationError(`Actor is not authorized for ${required} access in this tenant.`); }

/** SQL adapter interface keeps Postgres dependency-injected instead of bundling credentials in the product. */
export interface SqlExecutor { query(sql: string, values: unknown[]): Promise<{ rows: unknown[] }>; }
export class PostgresEvidenceRepository implements TenantEvidenceRepository {
  constructor(private readonly sql: SqlExecutor) {}
  async saveEvidence(evidence: WorkflowEvidence): Promise<void> { await this.sql.query("insert into workflow_evidence (tenant_id, run_id, payload, emitted_at) values ($1,$2,$3::jsonb,$4) on conflict (tenant_id,run_id) do update set payload=excluded.payload, emitted_at=excluded.emitted_at", [evidence.tenantId, evidence.runId, JSON.stringify(evidence), evidence.emittedAt]); }
  async evidenceForRun(tenantId: string, runId: string): Promise<WorkflowEvidence | undefined> { const result = await this.sql.query("select payload from workflow_evidence where tenant_id=$1 and run_id=$2", [tenantId, runId]); return (result.rows[0] as { payload?: WorkflowEvidence } | undefined)?.payload; }
  async appendAudit(event: AuditEvent): Promise<void> { await this.sql.query("insert into audit_events (tenant_id, actor_id, action, target, occurred_at, metadata) values ($1,$2,$3,$4,$5,$6::jsonb)", [event.tenantId, event.actorId, event.action, event.target, event.occurredAt, JSON.stringify(event.metadata)]); }
}
