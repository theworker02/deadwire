# SDK API contract

`WorkflowRecorder.run` and `UpstashEvidenceBridge.run` wrap user callbacks. `UpstashEvidenceBridge.tool` names agent-tool boundaries as `agent:<agent>/tool:<tool>`. `HmacEvidenceEmitter` signs the exact JSON evidence body; it never sends a QStash token.
