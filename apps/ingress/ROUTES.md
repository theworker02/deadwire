# Ingress routes

`POST /v1/evidence/workflow` accepts HMAC-signed SDK evidence. `POST /v1/evidence/upstash-failure` accepts a verified, normalized Upstash failure callback. `POST /v1/signals/deployment` accepts a verified GitHub/Vercel/CI event. `POST /v1/signals/trace` accepts allowlisted trace signals.

Every route returns an ingestion ID, never a recovery decision. Analysis is asynchronous so a provider callback cannot be delayed by correlation work.
