# Deadwire 1.9.1 Release Notes

## Release thesis

Deadwire is the missing recovery-intelligence layer for durable workflows. It does not compete with execution engines. It converts the operational ambiguity around retries, DLQ resumes, code changes, side effects, and batch recovery into an evidence-backed control protocol.

## What a buyer can evaluate immediately

1. Run `npm test` for the evidence, replay-risk, approval, canary, deployment-compatibility, agent-loop, and Upstash-native behavior.
2. Run `npm run demo` to inspect a deterministic incident, blast-radius report, and policy decision.
3. Open `site/index.html` or deploy `site/` with GitHub Pages for an interactive product walkthrough.
4. Read `docs/DEMO_SCRIPT.md` for the 8-minute technical demo and `docs/ACQUISITION_BRIEF.md` for the product rationale.
5. Open `site/presentation.html` for the animated 60-second recovery story, then review `docs/ACQUISITION_HANDOFF.md` for the hosted-product conversion path.

## Material limitations

This is a product foundation, not a hosted SaaS deployment. Live Upstash, GitHub, verifier, identity-provider, and Postgres credentials are intentionally deployment-owned. The included QStash control client will not act without an approved receipt and flow-control configuration. No external recovery was triggered during this release.

## Release checklist

- Version synchronized in `package.json` and lockfile (`1.9.1`)
- Strict typecheck and test suite passed
- Static Pages site prepared
- Animated product walkthrough and full-screen presentation prepared
- Console, ingress, recovery-worker, policy, verifier, connector, schema, fixture, and runbook contracts included
- Proprietary license included
- No secrets included
- No release, tag, or deployment published because this workspace has no Git remote or GitHub authorization
