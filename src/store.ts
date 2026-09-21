import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { ExecutionFailure, Incident } from "./core.js";
import type { WorkflowEvidence } from "./contracts.js";
import type { RecoveryReceipt } from "./recovery.js";

interface PersistedState { failures: ExecutionFailure[]; receipts: RecoveryReceipt[]; evidence: WorkflowEvidence[]; }
const empty: PersistedState = { failures: [], receipts: [], evidence: [] };

export class LocalEvidenceStore {
  constructor(private readonly path = ".deadwire/evidence.json") { }
  load(): PersistedState { const state = existsSync(this.path) ? JSON.parse(readFileSync(this.path, "utf8")) as Partial<PersistedState> : structuredClone(empty); return { failures: state.failures ?? [], receipts: state.receipts ?? [], evidence: state.evidence ?? [] }; }
  ingest(failures: ExecutionFailure[]): number {
    const state = this.load(); const known = new Set(state.failures.map((failure) => failure.id));
    state.failures.push(...failures.filter((failure) => !known.has(failure.id)));
    this.save(state); return state.failures.length;
  }
  receipts(): RecoveryReceipt[] { return this.load().receipts; }
  saveReceipt(receipt: RecoveryReceipt): void { const state = this.load(); state.receipts = [...state.receipts.filter((item) => item.id !== receipt.id), receipt]; this.save(state); }
  getReceipt(id: string): RecoveryReceipt | undefined { return this.receipts().find((receipt) => receipt.id === id); }
  saveEvidence(evidence: WorkflowEvidence): void { const state = this.load(); state.evidence = [...state.evidence.filter((item) => !(item.tenantId === evidence.tenantId && item.runId === evidence.runId)), evidence]; this.save(state); }
  private save(state: PersistedState): void { mkdirSync(".deadwire", { recursive: true }); writeFileSync(this.path, JSON.stringify(state, null, 2)); }
}

export function incidentsFrom(store: LocalEvidenceStore, cluster: (failures: ExecutionFailure[]) => Incident[]): Incident[] { return cluster(store.load().failures); }
