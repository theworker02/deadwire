async function get(path: string): Promise<any> { return (await fetch(path)).json(); }
async function boot(): Promise<void> {
  const host = document.querySelector("#incident")!;
  const result = document.querySelector("#result")!;
  const data = await get("/api/incident");
  const plan = data.plan.map((item: any) => `<tr><td>${item.executionId}</td><td class="${item.action === "SAFE_RESUME" ? "safe" : "block"}">${item.action}</td><td>${item.reason}</td></tr>`).join("");
  const loops = data.agentLoops.map((loop: any) => `${loop.agent}: ${loop.iterations} repeated states, ${loop.estimatedUnnecessaryModelCalls} estimated unnecessary model calls`).join("\n") || "No loops detected.";
  host.innerHTML = `<div class="incident"><h2>${data.incident.id}</h2><p><b>${data.incident.failures.length}</b> affected executions · ${data.incident.sharedBoundary}</p><p class="muted">First observed ${data.incident.firstObserved}; correlation confidence ${data.incident.confidence}%.</p></div><h3>Recovery batch</h3><table><tr><th>Run</th><th>Action</th><th>Reason</th></tr>${plan}</table><h3>Agent forensics</h3><pre>${loops}</pre>`;
  document.querySelector("#sim")!.addEventListener("click", () => { const passed = data.simulation.filter((r: any) => r.passed).length; const blocked = data.plan.filter((p: any) => p.action === "BLOCK").length; result.textContent = `${passed}/${data.simulation.length} fixtures passed\n${blocked} execution(s) remain blocked by side-effect evidence.`; });
}
void boot();
