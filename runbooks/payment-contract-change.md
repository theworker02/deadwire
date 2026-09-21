# Payment contract change

1. Freeze automatic recovery.
2. Compare provider response schema and deployment diff.
3. Verify every candidate payment through `PaymentTransactionVerifier`.
4. Deploy a backward-compatible fix.
5. Re-run workflow compatibility analysis.
6. Start a 1% canary with the financial recovery policy.
7. Halt on any recurring contract signature; otherwise ramp and reconcile.
