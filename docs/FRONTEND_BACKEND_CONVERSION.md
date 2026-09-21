# Static demo to product conversion

The Pages demo is intentionally a static presentation layer. It can become the marketing shell or the starting visual language for a product console.

## Frontend conversion

Move `site/` styles, status treatment, animated walkthrough, and incident demo components into a React/Next.js application. Replace fixture state with the console API routes defined in `apps/console/API_BOUNDARY.md`. Preserve reduced-motion behavior and explicit fixture/live-data labels.

## Backend conversion

Split the current Node reference into ingress, API, analysis worker, simulation worker, and recovery worker. Keep the domain contracts in a shared package. Bind `TenantEvidenceRepository` to Postgres and an encrypted fixture vault. Run correlation asynchronously and never block webhook acknowledgements on analysis.

## Authentication conversion

Add tenant identity and RBAC before exposing evidence or recovery actions. A viewer can read redacted incidents; a responder can propose plans; an approver can approve; an admin manages policy/connectors. The worker must independently recheck every authorization-sensitive decision.
