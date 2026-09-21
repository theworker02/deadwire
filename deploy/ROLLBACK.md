# Rollback strategy

Disable recovery-worker mutations first, preserving ingress and read-only analysis. Keep receipts and evidence intact. Roll back the console/API separately from the worker. A halted recovery batch remains halted across application rollbacks until a new signed decision is made.
