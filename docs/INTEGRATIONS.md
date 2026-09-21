# Integrations

## Upstash Workflow and QStash

Instrument owned workflow boundaries through `WorkflowRecorder`. Deadwire records stable source hashes, completion ordering, deployment provenance, and sanitized shapes. For recovery, use `UpstashRecoveryControl` only inside a trusted server-side worker after a `RecoveryReceipt` is approved.

The SDK does not monkey-patch Upstash. This keeps the integration explicit and avoids depending on private SDK behavior.

See [the concrete Upstash Workflow example](../examples/upstash-workflow/route.ts) and [the native integration blueprint](UPSTASH_INTEGRATION_BLUEPRINT.md).

## Evidence webhook

`POST /api/webhooks/evidence` accepts signed `WorkflowEvidence`. Sign the exact JSON body with `HMAC-SHA256` and send `X-Deadwire-Signature: sha256=<digest>`. Enforce request size, TLS, rate limits, replay protection, and tenant routing at the production edge.

## GitHub and Vercel

`GitHubDeploymentSource` uses a fine-grained read-only token to compare deployment SHAs and identify changed files/lockfiles. `normalizeVercelDeployment` creates a deployment signal after the hosting edge has verified the Vercel webhook. Correlate those signals to source hashes in workflow evidence before allowing resume.

## OpenTelemetry, Sentry, and provider status

Translate traces and incidents into `TraceSignal` at the edge. The core correlates dependency and deployment error boundaries; a production connector should own each vendor token and preserve tenant separation.

## Side-effect verifiers

Use the included payment, delivery, database-outbox, object-output, and HTTP contracts as adapter points. A verifier returns `absent`, `confirmed`, `idempotent`, or `unknown`. Unknown is deliberately terminal for an automated recovery decision.

## Additional engines

The normalized contracts are provider-neutral. Implement source and control adapters for Temporal, Inngest, Trigger.dev, Step Functions, and Cloudflare Workflows without changing incident, safety, or receipt models.
