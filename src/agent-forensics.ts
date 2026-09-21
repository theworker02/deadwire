import { createHash } from "node:crypto";

export interface AgentEvent {
  runId: string;
  agent: string;
  sequence: number;
  state: string;
  semanticProgress: number;
  modelCalls: number;
  timestamp: string;
}

export interface AgentLoop { runId: string; agent: string; cycle: string[]; iterations: number; semanticProgress: number; estimatedUnnecessaryModelCalls: number; }

export function stateFingerprint(state: string): string { return createHash("sha256").update(state.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex").slice(0, 12); }

export function detectAgentLoops(events: AgentEvent[], minimumRepeats = 3): AgentLoop[] {
  const grouped = new Map<string, AgentEvent[]>();
  for (const event of events) grouped.set(`${event.runId}:${event.agent}`, [...(grouped.get(`${event.runId}:${event.agent}`) ?? []), event]);
  const loops: AgentLoop[] = [];
  for (const run of grouped.values()) {
    const ordered = [...run].sort((a, b) => a.sequence - b.sequence);
    const fingerprints = ordered.map((event) => stateFingerprint(event.state));
    for (let cycleSize = 1; cycleSize <= Math.floor(fingerprints.length / minimumRepeats); cycleSize++) {
      const cycle = fingerprints.slice(0, cycleSize);
      let repeats = 1;
      while (cycle.every((value, position) => fingerprints[(repeats * cycleSize) + position] === value)) repeats++;
      if (repeats >= minimumRepeats) {
        const loopEvents = ordered.slice(0, repeats * cycleSize);
        loops.push({ runId: ordered[0].runId, agent: ordered[0].agent, cycle, iterations: repeats * cycleSize, semanticProgress: Math.round((loopEvents.reduce((sum, event) => sum + event.semanticProgress, 0) / loopEvents.length) * 100) / 100, estimatedUnnecessaryModelCalls: loopEvents.slice(cycleSize).reduce((sum, event) => sum + event.modelCalls, 0) });
        break;
      }
    }
  }
  return loops;
}
