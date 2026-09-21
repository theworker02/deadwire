# OpenTelemetry connector

The OpenTelemetry connector translates dependency spans into `TraceSignal`. Correlation uses dependency, deployment SHA, timestamp, tenant, and status; it should not ingest unrestricted trace payloads.
