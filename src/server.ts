import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { candidateStepHashes, failures } from "./fixtures.js";
import { clusterFailures, makePlan, simulate } from "./core.js";
import { detectAgentLoops, type AgentEvent } from "./agent-forensics.js";
import { approveReceipt, createRecoveryReceipt, RecoveryGateError } from "./recovery.js";
import { LocalEvidenceStore, incidentsFrom } from "./store.js";
import { validateWorkflowEvidence, verifyHmacSignature } from "./webhooks.js";

const store = new LocalEvidenceStore();
if (store.load().failures.length === 0) store.ingest(failures);
const sampleAgentEvents: AgentEvent[] = ["search", "evaluate", "search", "evaluate", "search", "evaluate"].map((state, sequence) => ({ runId: "agent-7a21", agent: "researcher", sequence, state, semanticProgress: 0.03, modelCalls: 1, timestamp: `2026-09-21T14:0${sequence}:00Z` }));
const server = createServer(async (request, response) => {
  const url = request.url ?? "/";
  const incidents = incidentsFrom(store, clusterFailures);
  const incident = incidents[0];
  if (url === "/api/incidents") return json(response, incidents.map((item) => ({ id: item.id, affectedRuns: item.failures.length, firstObserved: item.firstObserved, boundary: item.sharedBoundary, confidence: item.confidence })));
  if (url === "/api/incident") return json(response, incidentPayload(incident));
  if (url === "/api/agent-loops") return json(response, detectAgentLoops(sampleAgentEvents));
  if (url === "/api/receipts") return json(response, store.receipts());
  if (request.method === "POST" && url === "/api/ingest") {
    try { const input = await body(request); if (!Array.isArray(input)) throw new Error("Expected an array of normalized failures."); return json(response, { totalStored: store.ingest(input as typeof failures) }, 201); } catch (error) { return fail(response, 400, error); }
  }
  if (request.method === "POST" && url === "/api/webhooks/evidence") {
    try {
      const raw = await rawBody(request); const secret = process.env.DEADWIRE_INGEST_SECRET;
      if (!secret) throw new Error("Evidence webhook is disabled until DEADWIRE_INGEST_SECRET is configured.");
      verifyHmacSignature(raw, request.headers?.["x-deadwire-signature"], secret);
      const evidence = validateWorkflowEvidence(JSON.parse(raw)); store.saveEvidence(evidence);
      return json(response, { accepted: true, runId: evidence.runId }, 202);
    } catch (error) { return fail(response, 401, error); }
  }
  if (request.method === "POST" && url === "/api/receipt") {
    try { const input = await body(request) as { proposedBy?: string }; const receipt = createRecoveryReceipt(incident, makePlan(incident, candidateStepHashes), input.proposedBy ?? "unknown"); store.saveReceipt(receipt); return json(response, receipt, 201); } catch (error) { return fail(response, 409, error); }
  }
  if (request.method === "POST" && url.startsWith("/api/receipts/") && url.endsWith("/approve")) {
    try { const id = url.split("/")[3]; const receipt = store.getReceipt(id); if (!receipt) return fail(response, 404, new Error("Recovery receipt not found.")); const input = await body(request) as { approvedBy?: string }; const approved = approveReceipt(receipt, input.approvedBy ?? ""); store.saveReceipt(approved); return json(response, approved); } catch (error) { return fail(response, 409, error); }
  }
  if (url === "/client.js") { response.writeHead(200, { "content-type": "application/javascript; charset=utf-8" }); response.end(readFileSync(new URL("./client.js", import.meta.url).pathname, "utf8")); return; }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'self'" });
  response.end(page());
});
function incidentPayload(incident: ReturnType<typeof incidentsFrom>[number]): unknown { return { incident, plan: makePlan(incident, candidateStepHashes), simulation: simulate(incident, candidateStepHashes), agentLoops: detectAgentLoops(sampleAgentEvents), receipts: store.receipts().filter((receipt) => receipt.incidentId === incident.id) }; }
function json(response: any, body: unknown, status = 200): void { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); }
function fail(response: any, status: number, error: unknown): void { json(response, { error: error instanceof Error ? error.message : "Unknown error" }, status); }
function body(request: any): Promise<unknown> { return new Promise((resolve, reject) => { let raw = ""; request.on("data", (chunk: any) => { raw += chunk.toString(); if (raw.length > 1_000_000) reject(new Error("Request body exceeds 1 MB.")); }); request.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Request body must be valid JSON.")); } }); request.on("error", reject); }); }
function rawBody(request: any): Promise<string> { return new Promise((resolve, reject) => { let raw = ""; request.on("data", (chunk: any) => { raw += chunk.toString(); if (raw.length > 1_000_000) reject(new Error("Request body exceeds 1 MB.")); }); request.on("end", () => resolve(raw)); request.on("error", reject); }); }
server.listen(8787, "127.0.0.1", () => console.log("Deadwire dashboard: http://127.0.0.1:8787 (fixture mode)"));
function page(): string { return `<!doctype html><html><head><title>Deadwire</title><style>body{margin:0;background:#0d1016;color:#e9edf5;font:15px system-ui}.shell{max-width:1180px;margin:auto;padding:42px}h1{font-size:34px;margin:0}small,.muted{color:#98a4b8}.badge{color:#8bc8ff;border:1px solid #294965;padding:5px 9px;border-radius:5px}main{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-top:30px}.panel{background:#151a23;border:1px solid #273142;border-radius:10px;padding:22px}.incident{border-left:3px solid #ffb36b;padding-left:15px}table{width:100%;border-collapse:collapse;margin-top:14px}td,th{text-align:left;padding:11px;border-bottom:1px solid #273142}.safe{color:#80dfae}.block{color:#ff958c}button{background:#1477bb;color:#fff;border:0;border-radius:5px;padding:9px 12px;cursor:pointer}pre{white-space:pre-wrap;line-height:1.5}</style></head><body><div class="shell"><span class="badge">LOCAL EVIDENCE STORE · fixture seed</span><h1>Deadwire</h1><p class="muted">Failure intelligence and recovery control for durable workflows.</p><main><section class="panel"><small>ACTIVE INCIDENT</small><div id="incident">Loading incident analysis…</div></section><aside class="panel"><small>RECOVERY GUARDRAIL</small><h2>Approval-gated recovery</h2><p class="muted">A receipt is generated only for plans with no blocked or manual-review executions. Provider mutation remains intentionally unavailable.</p><button id="sim">Run deterministic simulation</button><pre id="result"></pre></aside></main></div><script defer src="/client.js"></script></body></html>`; }
