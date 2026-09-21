# Acquisition handoff guide

## What transfers

Deadwire transfers as an Upstash-first recovery-intelligence product concept, reference implementation, SDK/adapter contracts, policy and verifier model, static presentation, operator runbooks, and a production topology.

## Fastest path to a hosted product

1. Retain the executable `src/` core as a shared domain package.
2. Implement the ingress service around the signed schema and tenant repository.
3. Build the console from `apps/console/` API/design contracts.
4. Deploy the recovery worker privately with QStash credentials and strict policy checks.
5. Wire GitHub, Vercel, OpenTelemetry, and customer-specific verifier connectors.
6. Use the Pages site as the product marketing surface until the console is live.

## What must not be assumed

No live Upstash account, customer data, provider credential, hosted Postgres instance, or production deployment is bundled. The repository intentionally provides safe seams instead of fabricated operational claims.

## Strategic value

The acquisition value is the evidence-first recovery model and the integration fit: Upstash already owns durable execution; Deadwire makes recovery behavior explainable, policy-controlled, and safer for external side effects and agents.
