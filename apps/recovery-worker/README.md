# Recovery worker

The recovery worker is the only process permitted to hold the QStash recovery credential. It loads an approved receipt, verifies current policy and batch state, issues a flow-controlled canary/ramp command, and reconciles provider response IDs.
