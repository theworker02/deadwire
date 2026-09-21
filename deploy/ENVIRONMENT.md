# Environment reference

| Variable | Runtime | Required | Purpose |
| --- | --- | --- | --- |
| `DEADWIRE_INGEST_SECRET` | ingress + SDK | yes | HMAC evidence verification/signing |
| `UPSTASH_QSTASH_TOKEN` | recovery worker only | for live recovery | QStash DLQ/resume access |
| `DATABASE_URL` | API, ingress, worker | production | tenant evidence/audit persistence |
| `GIT_SHA` | customer workflow | recommended | source compatibility provenance |
| `GITHUB_TOKEN` | GitHub connector | optional | read-only deployment compare |
| provider verifier credentials | verifier worker | per connector | side-effect verification |

Never add any of these values to `site/`, fixture data, source control, browser bundles, or public issue logs.
