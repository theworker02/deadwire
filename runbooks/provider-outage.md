# Provider outage

1. Confirm the dependency boundary across traces and provider status.
2. Do not restart side-effecting workflows merely to bypass an outage.
3. Wait for provider recovery and use a low-rate canary.
4. Reclassify failures that persist after the canary as a separate incident.
