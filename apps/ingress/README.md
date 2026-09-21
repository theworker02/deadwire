# Evidence ingress service

This service receives HMAC-signed `WorkflowEvidence`, validates schemas, applies tenant routing, deduplicates `(tenantId, runId)`, and writes to the evidence repository. It must not hold the QStash recovery token.
