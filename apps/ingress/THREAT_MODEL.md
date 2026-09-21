# Ingress threat model

Threats: forged evidence, replayed webhooks, oversized bodies, cross-tenant writes, raw secret capture, and noisy failure floods.

Controls: HMAC verification, timestamp/nonce replay window, request-size limits, tenant-scoped authentication, structural redaction, rate limiting, durable queueing, and immutable audit events.
