# Reconciliation

For every mutation, store provider request ID when available, original DLQ ID, returned workflow run ID, created timestamp, batch ID, receipt ID, and outcome. Periodically reconcile missing/ambiguous responses against Upstash before allowing another mutation for the same DLQ entry.
