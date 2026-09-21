import type { SideEffectKind, SideEffectVerifier, SideEffectVerification } from "./contracts.js";

export class SimulationRegistry {
  private readonly verifiers = new Map<SideEffectKind, SideEffectVerifier>();
  register(verifier: SideEffectVerifier): void { this.verifiers.set(verifier.kind, verifier); }
  async verify(kind: SideEffectKind, evidence: Parameters<SideEffectVerifier["verify"]>[0]): Promise<SideEffectVerification> {
    const verifier = this.verifiers.get(kind);
    return verifier ? verifier.verify(evidence) : { outcome: "unknown", evidence: `No ${kind} simulation verifier is configured.`, checkedAt: new Date().toISOString() };
  }
}

/** Works for sandbox/status endpoints returning `{ outcome, evidence }`; no credentials are embedded. */
export class HttpSideEffectVerifier implements SideEffectVerifier {
  constructor(readonly kind: SideEffectKind, private readonly endpoint: string, private readonly token?: string) {}
  async verify(input: Parameters<SideEffectVerifier["verify"]>[0]): Promise<SideEffectVerification> {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json", ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }, body: JSON.stringify(input) } as any);
    if (!response.ok) return { outcome: "unknown", evidence: `Verification endpoint returned ${response.status}.`, checkedAt: new Date().toISOString() };
    const result = await response.json() as Partial<SideEffectVerification>;
    if (!["absent", "confirmed", "unknown", "idempotent"].includes(result.outcome ?? "")) return { outcome: "unknown", evidence: "Verification endpoint returned an invalid outcome.", checkedAt: new Date().toISOString() };
    return { outcome: result.outcome as SideEffectVerification["outcome"], evidence: result.evidence ?? "External verifier supplied no evidence.", checkedAt: new Date().toISOString() };
  }
}
