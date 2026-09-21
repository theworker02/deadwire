# Deadwire workspace map

Deadwire is organized as a platform workspace because a credible recovery-control product has more than one runtime or one library. The executable TypeScript reference implementation remains in `src/`; the adjacent surfaces define the contracts, operating policy, integration seams, deployment artifacts, examples, and buyer-facing experience required to evolve it into a hosted product.

| Directory | Product responsibility |
| --- | --- |
| `src/` | Executable reference core and tests |
| `apps/console/` | Operator console product specification |
| `apps/ingress/` | Signed evidence-ingress boundary |
| `apps/recovery-worker/` | Approved recovery execution boundary |
| `packages/sdk/` | Application instrumentation contract |
| `packages/upstash-adapter/` | Upstash DLQ and recovery integration contract |
| `packages/evidence/` | Evidence semantics and redaction contract |
| `packages/policy/` | Approval, canary, and recovery policy contract |
| `packages/simulation/` | Verifier and replay-evaluation contract |
| `packages/agent-forensics/` | Agent telemetry/loop/cost contract |
| `connectors/` | Vendor signal integration specifications |
| `schemas/` | JSON interchange schemas |
| `policies/` | Versioned policy examples |
| `runbooks/` | Operator actions for repeatable incidents |
| `fixtures/` | Safe, sanitized demo evidence |
| `deploy/` | Production topology and deployment files |
| `scripts/` | Local release and validation operations |
| `examples/` | Integration examples |
| `site/` | GitHub Pages product site and presentation |
| `docs/` | Architecture, acquisition, and integration material |

The directories are intentionally additive. The platform should be split into independently versioned packages only when the deployment and release workflow requires it; duplicating the current executable core prematurely would weaken the project.
