# Unsafe replay

1. Do not approve a recovery receipt.
2. Identify the side-effect category and missing evidence.
3. Query the appropriate ledger/outbox/provider using a verifier.
4. Record the verifier outcome and operator rationale.
5. Create a new plan only when the effect is absent, confirmed/idempotent, or explicitly manually remediated.
