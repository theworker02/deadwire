# Deadwire 1.9.0 live-demo script

## Setup

```powershell
npm install
npm test
npm run demo
npm run dev
```

Open `http://127.0.0.1:8787` for the local evidence dashboard and open `site/index.html` for the acquisition-facing walkthrough.

## Eight-minute flow

1. **Set the stakes:** describe 8,147 failures accumulating in a DLQ after a payment-provider contract change.
2. **Incident instead of entries:** show that failure clustering resolves thousands of records into one boundary and deployment hypothesis.
3. **Blast radius:** run `npm run demo`; point out workflows, deployments, dependencies, environments, severity, and policy decision.
4. **Safety:** show a payment execution as `BLOCK` because the external effect is unknown. Emphasize that Deadwire refuses to manufacture a passing simulation.
5. **Compatibility:** explain that a changed completed workflow step blocks resume even when the failed step itself looks safe.
6. **Recovery protocol:** walk through propose → simulate → approval → canary → observe → ramp → reconcile. Explain the recurrence halt.
7. **Agent angle:** show loop detection and wasted-call estimation using `npm run cli -- loops`.
8. **Close:** position Deadwire as recovery correctness for Upstash, not a replacement workflow runner.

## Demo guardrails

- Never enter a real QStash token in the demo browser.
- Do not claim a fixture incident is live production evidence.
- Do not call a live recovery endpoint in a buyer demo.
- State that external side-effect verifiers are customer-deployed adapters.
